package site.muyin.rightmenu.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import run.halo.aifoundation.AiModelService;
import run.halo.aifoundation.chat.GenerateTextRequest;
import run.halo.aifoundation.chat.LanguageModel;
import run.halo.aifoundation.chat.StreamTextResult;
import run.halo.app.plugin.extensionpoint.ExtensionGetter;

class AiFoundationGatewayTest {
    private final ExtensionGetter extensions = mock(ExtensionGetter.class);
    private final AiModelService service = mock(AiModelService.class);
    private final LanguageModel model = mock(LanguageModel.class);
    private final StreamTextResult result = mock(StreamTextResult.class);
    private final AiFoundationGateway gateway = new AiFoundationGateway(extensions);

    @BeforeEach
    void setUp() {
        when(extensions.getEnabledExtension(AiModelService.class)).thenReturn(Mono.just(service));
        when(service.languageModel(null)).thenReturn(Mono.just(model));
        when(model.streamText(any())).thenReturn(result);
    }

    @Test
    void surfacesAFinalProviderErrorAfterTheTextProjectionCompletes() {
        when(result.textStream()).thenReturn(Flux.just("部分结果"));
        when(result.result()).thenReturn(Mono.error(new IllegalStateException("final provider error")));
        StepVerifier.create(gateway.generate(new RightMenuAiSetting(), "explain", "文字"))
            .expectNext("部分结果")
            .expectErrorMessage("final provider error")
            .verify();
    }

    @Test
    void cancellationStopsTheSubscriptionAndSignalsTheSdk() {
        var request = new AtomicReference<GenerateTextRequest>();
        when(model.streamText(any())).thenAnswer(invocation -> {
            request.set(invocation.getArgument(0));
            return result;
        });
        when(result.textStream()).thenReturn(Flux.concat(Flux.just("开始"), Flux.never()));
        when(result.result()).thenReturn(Mono.empty());
        StepVerifier.create(gateway.generate(new RightMenuAiSetting(), "example", "文字"))
            .expectNext("开始").thenCancel().verify();
        assertThat(request.get().getCancellationToken().isCancellationRequested()).isTrue();
        assertThat(request.get().getMaxOutputTokens()).isEqualTo(800);
        assertThat(request.get().getPrompt()).isEqualTo("选区：\n文字");
    }
}
