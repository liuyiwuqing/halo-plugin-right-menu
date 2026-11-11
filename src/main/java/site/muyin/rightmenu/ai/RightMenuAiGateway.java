package site.muyin.rightmenu.ai;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** 不引用可选 SDK 类型的业务边界，让普通菜单可独立启动。 */
public interface RightMenuAiGateway {
    Mono<Boolean> available(String modelName);
    Flux<String> generate(RightMenuAiSetting setting, String mode, String text);
}
