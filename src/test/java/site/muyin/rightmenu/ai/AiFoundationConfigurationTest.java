package site.muyin.rightmenu.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.FilteredClassLoader;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.plugin.extensionpoint.ExtensionGetter;

class AiFoundationConfigurationTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
        .withUserConfiguration(AiFoundationConfiguration.class)
        .withBean(ExtensionGetter.class, () -> mock(ExtensionGetter.class))
        .withBean(ReactiveSettingFetcher.class, () -> mock(ReactiveSettingFetcher.class))
        .withBean(RightMenuAiQuota.class)
        .withBean(RightMenuAiEndpoint.class);

    @Test
    void missingSdkLeavesTheBaseComponentsAvailable() {
        context.withClassLoader(new FilteredClassLoader("run.halo.aifoundation")).run(result -> {
            assertThat(result).hasNotFailed().hasSingleBean(RightMenuAiEndpoint.class)
                .doesNotHaveBean(RightMenuAiGateway.class);
        });
    }

    @Test
    void presentSdkRegistersTheOptionalAdapter() {
        context.run(result -> assertThat(result).hasNotFailed().hasSingleBean(RightMenuAiGateway.class));
    }
}
