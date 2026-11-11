package site.muyin.rightmenu.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.Principal;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.server.support.ServerRequestWrapper;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import run.halo.app.plugin.ReactiveSettingFetcher;
import site.muyin.rightmenu.setting.RightMenuSetting;

class RightMenuAiEndpointTest {
    private final RightMenuAiSetting setting = new RightMenuAiSetting().setEnabled(true);
    private final RightMenuSetting general = RightMenuSetting.defaults();
    private final RightMenuAiGateway gateway = mock(RightMenuAiGateway.class);
    private final ReactiveSettingFetcher fetcher = mock(ReactiveSettingFetcher.class);
    @SuppressWarnings("unchecked")
    private final ObjectProvider<RightMenuAiGateway> gateways = mock(ObjectProvider.class);
    private Mono<? extends Principal> principal = Mono.just(
        UsernamePasswordAuthenticationToken.authenticated("reader", "", java.util.List.of()));
    private WebTestClient client;

    @BeforeEach
    void setUp() {
        when(fetcher.fetch(RightMenuSetting.GROUP, RightMenuSetting.class)).thenReturn(Mono.just(general));
        when(fetcher.fetch(RightMenuAiSetting.GROUP, RightMenuAiSetting.class)).thenReturn(Mono.just(setting));
        when(gateways.getIfAvailable()).thenReturn(gateway);
        when(gateway.available(nullable(String.class))).thenReturn(Mono.just(true));
        when(gateway.generate(any(), anyString(), anyString())).thenReturn(Flux.just("解释结果"));
        var endpoint = new RightMenuAiEndpoint(fetcher, gateways, new RightMenuAiQuota());
        var router = endpoint.endpoint().filter((request, next) -> next.handle(new ServerRequestWrapper(request) {
            @Override
            public Mono<? extends Principal> principal() { return principal; }
        }));
        client = WebTestClient.bindToRouterFunction(router).build();
    }

    @Test
    void defaultsToDisabledAndHonorsTheGeneralSwitch() {
        setting.setEnabled(false);
        request("explain", "文字").expectStatus().isForbidden();
        setting.setEnabled(true);
        general.setEnabled(false);
        request("explain", "文字").expectStatus().isForbidden();
        verify(gateway, never()).generate(any(), anyString(), anyString());
    }

    @Test
    void anonymousReadersNeedAnExplicitOptIn() {
        principal = Mono.empty();
        request("translate", "hello").expectStatus().isUnauthorized();
        setting.setAllowAnonymous(true);
        request("translate", "hello").expectStatus().isOk();
    }

    @Test
    void rejectsUnknownModesAndOversizedOrBlankSelections() {
        request("chat", "文字").expectStatus().isBadRequest();
        request("explain", "字".repeat(3001)).expectStatus().isBadRequest();
        request("example", " ").expectStatus().isBadRequest();
        client.post().uri("/ai/explain").header("Content-Type", "application/json")
            .bodyValue("{invalid").exchange().expectStatus().isBadRequest();
        verify(gateway, never()).generate(any(), anyString(), anyString());
    }

    @Test
    void missingDependencyDegradesToUnavailableWithoutExposingModelSettings() {
        setting.setModelName("private-model-name");
        when(gateways.getIfAvailable()).thenReturn(null);
        client.get().uri("/ai/config").exchange().expectStatus().isOk()
            .expectHeader().valueEquals("Cache-Control", "no-store")
            .expectBody().jsonPath("$.available").isEqualTo(false)
            .jsonPath("$.modelName").doesNotExist();
        request("explain", "文字").expectStatus().isEqualTo(503);
    }

    @Test
    void emitsADoneFrameOnlyAfterSuccessfulGeneration() {
        var chunks = request("explain", "  文字  ").expectStatus().isOk()
            .expectHeader().contentType("application/x-ndjson")
            .returnResult(RightMenuAiEndpoint.ReadingChunk.class).getResponseBody();
        StepVerifier.create(chunks)
            .expectNext(new RightMenuAiEndpoint.ReadingChunk("delta", "解释结果"))
            .expectNext(new RightMenuAiEndpoint.ReadingChunk("done", ""))
            .verifyComplete();
        verify(gateway).generate(setting, "explain", "文字");
    }

    @Test
    void turnsProviderFailuresIntoAnErrorFrameAndReleasesConcurrency() {
        setting.setMaxConcurrentRequests(1);
        when(gateway.generate(any(), anyString(), anyString())).thenReturn(
            Flux.concat(Flux.just("部分结果"), Flux.error(new IllegalStateException("provider credential"))));
        var chunks = request("explain", "文字").expectStatus().isOk()
            .returnResult(RightMenuAiEndpoint.ReadingChunk.class).getResponseBody();
        StepVerifier.create(chunks)
            .expectNext(new RightMenuAiEndpoint.ReadingChunk("delta", "部分结果"))
            .assertNext(chunk -> {
                assertThat(chunk.type()).isEqualTo("error");
                assertThat(chunk.text()).doesNotContain("provider credential");
            }).verifyComplete();
        when(gateway.generate(any(), anyString(), anyString())).thenReturn(Flux.just("恢复"));
        request("example", "文字").expectStatus().isOk();
    }

    @Test
    void enforcesThePerUserMinuteQuota() {
        setting.setRequestsPerMinute(1);
        request("explain", "文字").expectStatus().isOk().expectBody().consumeWith(result -> {});
        request("explain", "文字").expectStatus().isEqualTo(429);
    }

    @Test
    void cancellingTheResponseCancelsGenerationAndReleasesConcurrency() {
        setting.setMaxConcurrentRequests(1);
        var cancelled = new AtomicBoolean();
        when(gateway.generate(any(), anyString(), anyString())).thenReturn(
            Flux.concat(Flux.just("开始"), Flux.<String>never()).doOnCancel(() -> cancelled.set(true)));
        var chunks = request("explain", "文字").expectStatus().isOk()
            .returnResult(RightMenuAiEndpoint.ReadingChunk.class).getResponseBody();
        StepVerifier.create(chunks).expectNext(new RightMenuAiEndpoint.ReadingChunk("delta", "开始"))
            .then(() -> request("example", "文字").expectStatus().isEqualTo(429))
            .thenCancel().verify();
        assertThat(cancelled).isTrue();
        when(gateway.generate(any(), anyString(), anyString())).thenReturn(Flux.just("下一次"));
        request("explain", "文字").expectStatus().isOk();
    }

    @Test
    void forwardingHeadersCannotResetAnonymousQuotas() {
        principal = Mono.empty();
        setting.setAllowAnonymous(true).setRequestsPerMinute(1);
        client.post().uri("/ai/explain").header("X-Forwarded-For", "address-a")
            .bodyValue(new RightMenuAiEndpoint.ReadingRequest("explain", "文字"))
            .exchange().expectStatus().isOk().expectBody().consumeWith(result -> {});
        client.post().uri("/ai/explain").header("X-Forwarded-For", "address-b")
            .bodyValue(new RightMenuAiEndpoint.ReadingRequest("explain", "文字"))
            .exchange().expectStatus().isEqualTo(429);
    }

    @Test
    void classifiesSettingOrServiceFailureAsUnavailable() {
        when(fetcher.fetch(RightMenuAiSetting.GROUP, RightMenuAiSetting.class))
            .thenReturn(Mono.error(new IllegalStateException("config unavailable")));
        request("explain", "文字").expectStatus().isEqualTo(503);
        client.get().uri("/ai/config").exchange().expectStatus().isEqualTo(503);
    }

    private WebTestClient.ResponseSpec request(String mode, String text) {
        return client.post().uri("/ai/explain")
            .bodyValue(new RightMenuAiEndpoint.ReadingRequest(mode, text)).exchange();
    }
}
