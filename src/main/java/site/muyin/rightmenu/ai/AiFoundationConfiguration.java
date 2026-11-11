package site.muyin.rightmenu.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import run.halo.app.plugin.extensionpoint.ExtensionGetter;

@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(name = "run.halo.aifoundation.AiModelService")
public class AiFoundationConfiguration {
    @Bean
    RightMenuAiGateway rightMenuAiGateway(ExtensionGetter extensionGetter) {
        return new AiFoundationGateway(extensionGetter);
    }
}
