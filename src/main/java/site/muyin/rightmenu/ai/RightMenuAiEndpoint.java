package site.muyin.rightmenu.ai;

import static org.springdoc.core.fn.builders.content.Builder.contentBuilder;
import static org.springdoc.core.fn.builders.requestbody.Builder.requestBodyBuilder;
import static org.springdoc.core.fn.builders.schema.Builder.schemaBuilder;

import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springdoc.webflux.core.fn.SpringdocRouteBuilder;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.codec.DecodingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import run.halo.app.core.extension.endpoint.CustomEndpoint;
import run.halo.app.extension.GroupVersion;
import run.halo.app.plugin.ReactiveSettingFetcher;
import site.muyin.rightmenu.setting.RightMenuSetting;

@Component
@RequiredArgsConstructor
public class RightMenuAiEndpoint implements CustomEndpoint {
    public static final String GROUP_VERSION = "api.right-menu.muyin.site/v1alpha1";
    private final ReactiveSettingFetcher settingFetcher;
    private final ObjectProvider<RightMenuAiGateway> gateways;
    private final RightMenuAiQuota quota;

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        return SpringdocRouteBuilder.route()
            .GET("/ai/config", this::config, builder -> builder
                .operationId("rightMenuAiConfig").tag(GROUP_VERSION + "/Reading")
                .description("获取 AI 阅读助手可用状态，不包含模型凭据"))
            .POST("/ai/explain", this::explain, builder -> builder
                .operationId("rightMenuAiExplain").tag(GROUP_VERSION + "/Reading")
                .description("解释、翻译或举例；按 NDJSON 输出 delta、done 或 error，断连取消生成")
                .requestBody(requestBodyBuilder().required(true).content(contentBuilder()
                    .mediaType(MediaType.APPLICATION_JSON_VALUE)
                    .schema(schemaBuilder().implementation(ReadingRequest.class)))))
            .build();
    }

    @Override
    public GroupVersion groupVersion() { return GroupVersion.parseAPIVersion(GROUP_VERSION); }

    private Mono<RightMenuAiSetting> settings() {
        return settingFetcher.fetch(RightMenuSetting.GROUP, RightMenuSetting.class)
            .defaultIfEmpty(RightMenuSetting.defaults())
            .flatMap(general -> {
                if (!general.enabledOrDefault()) {
                    return Mono.just(new RightMenuAiSetting());
                }
                return settingFetcher.fetch(RightMenuAiSetting.GROUP, RightMenuAiSetting.class)
                    .defaultIfEmpty(new RightMenuAiSetting());
            });
    }

    private Mono<ServerResponse> config(ServerRequest request) {
        return settings().flatMap(setting -> {
            var gateway = gateways.getIfAvailable();
            if (!setting.enabledOrDefault()) {
                return respondConfig(setting, false, "站长尚未启用 AI 阅读助手");
            }
            if (gateway == null) {
                return respondConfig(setting, false, "需要安装并启用 AI Foundation，且 Halo 版本不低于 2.26");
            }
            return gateway.available(setting.getModelName()).flatMap(available ->
                respondConfig(setting, available, available ? "" : "AI Foundation 或所选模型暂不可用"));
        }).onErrorResume(error -> respondError(HttpStatus.SERVICE_UNAVAILABLE, "暂时无法读取 AI 设置"));
    }

    private Mono<ServerResponse> respondConfig(RightMenuAiSetting setting, boolean available, String message) {
        return ServerResponse.ok().header("Cache-Control", "no-store")
            .bodyValue(new ReadingConfig(setting.enabledOrDefault(), available,
                setting.allowAnonymousOrDefault(), setting.inputLimit(), message));
    }

    private Mono<ServerResponse> explain(ServerRequest request) {
        return settings().flatMap(setting -> {
            if (!setting.enabledOrDefault()) {
                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "AI 阅读助手未启用"));
            }
            return identity(request, setting).flatMap(identity -> request.bodyToMono(ReadingRequest.class)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "请选择需要解释的文字")))
                .flatMap(input -> {
                    validate(input, setting);
                    var gateway = gateways.getIfAvailable();
                    if (gateway == null) {
                        return Mono.error(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI Foundation 未启用"));
                    }
                    return gateway.available(setting.getModelName()).flatMap(available -> {
                        if (!available) {
                            return Mono.error(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI Foundation 或所选模型暂不可用"));
                        }
                        Runnable release = quota.acquire(identity, setting);
                        Flux<ReadingChunk> stream = Flux.defer(() -> gateway.generate(setting, input.mode(), input.text().trim()))
                            .map(delta -> new ReadingChunk("delta", delta))
                            .concatWithValues(new ReadingChunk("done", ""))
                            .onErrorResume(error -> Flux.just(new ReadingChunk("error", "AI 生成失败或超时，请稍后重试")))
                            .doFinally(signal -> release.run());
                        return ServerResponse.ok().contentType(MediaType.APPLICATION_NDJSON)
                            .header("Cache-Control", "no-store")
                            .header("X-Accel-Buffering", "no")
                            .body(stream, ReadingChunk.class)
                            .doOnError(error -> release.run())
                            .doOnCancel(release);
                    });
                }));
        }).onErrorResume(ResponseStatusException.class, error -> respondError(error.getStatusCode().value(), error.getReason()))
            .onErrorResume(DecodingException.class, error -> respondError(HttpStatus.BAD_REQUEST, "请求格式错误"))
            .onErrorResume(error -> respondError(HttpStatus.SERVICE_UNAVAILABLE, "AI 服务暂不可用，请稍后重试"));
    }

    private Mono<String> identity(ServerRequest request, RightMenuAiSetting setting) {
        return request.principal()
            .filter(principal -> principal instanceof Authentication auth && auth.isAuthenticated()
                && !(auth instanceof AnonymousAuthenticationToken))
            .map(principal -> "user:" + principal.getName())
            .switchIfEmpty(Mono.defer(() -> {
                if (!setting.allowAnonymousOrDefault()) {
                    return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录再使用 AI 阅读助手"));
                }
                // Only the server's remote address is trusted; client-supplied forwarding headers cannot reset quotas.
                String address = request.remoteAddress().map(value -> value.getAddress() == null
                    ? value.getHostString() : value.getAddress().getHostAddress()).orElse("unknown");
                return Mono.just("visitor:" + address);
            }));
    }

    private static void validate(ReadingRequest input, RightMenuAiSetting setting) {
        if (input.mode() == null || !Set.of("explain", "example", "translate").contains(input.mode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不支持的阅读动作");
        }
        if (input.text() == null || input.text().isBlank() || input.text().length() > setting.inputLimit()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "选区应包含 1～" + setting.inputLimit() + " 个字符");
        }
    }
    private Mono<ServerResponse> respondError(HttpStatus status, String message) { return respondError(status.value(), message); }
    private Mono<ServerResponse> respondError(int status, String message) {
        return ServerResponse.status(status).header("Cache-Control", "no-store").bodyValue(new ReadingError(message));
    }
    public record ReadingRequest(String mode, String text) {}
    public record ReadingConfig(boolean enabled, boolean available, boolean allowAnonymous, int maxInputCharacters, String message) {}
    public record ReadingChunk(String type, String text) {}
    public record ReadingError(String message) {}
}
