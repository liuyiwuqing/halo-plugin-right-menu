package site.muyin.rightmenu;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import run.halo.app.plugin.BasePlugin;
import run.halo.app.plugin.PluginContext;

/**
 * <p>Plugin main class to manage the lifecycle of the plugin.</p>
 * <p>This class must be public and have a public constructor.</p>
 * <p>Only one main class extending {@link BasePlugin} is allowed per plugin.</p>
 *
 * @author Lywq
 * @since 1.0.0
 */
@Slf4j
@Component
public class RightMenuPlugin extends BasePlugin {

    public RightMenuPlugin(PluginContext pluginContext) {
        super(pluginContext);
    }

    @Override
    public void start() {
        log.info("Right menu plugin started.");
    }

    @Override
    public void stop() {
        log.info("Right menu plugin stopped.");
    }
}
