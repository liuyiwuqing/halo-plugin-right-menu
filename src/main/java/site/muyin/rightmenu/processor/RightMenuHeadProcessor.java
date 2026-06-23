package site.muyin.rightmenu.processor;

import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.context.IWebContext;
import org.thymeleaf.model.IModel;
import org.thymeleaf.model.IModelFactory;
import org.thymeleaf.processor.element.IElementModelStructureHandler;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.PluginContext;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.theme.dialect.TemplateHeadProcessor;
import site.muyin.rightmenu.setting.RightMenuSetting;
import site.muyin.rightmenu.support.RightMenuPostContextExtractor;
import site.muyin.rightmenu.support.RightMenuPathMatcher;
import site.muyin.rightmenu.template.RightMenuHtmlTpl;

/**
 * Injects right-menu assets into theme pages.
 *
 * @author Lywq
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.LOWEST_PRECEDENCE - 20)
public class RightMenuHeadProcessor implements TemplateHeadProcessor {

    private final ReactiveSettingFetcher settingFetcher;
    private final PluginContext pluginContext;

    @Override
    public Mono<Void> process(ITemplateContext context, IModel model,
                              IElementModelStructureHandler structureHandler) {
        String requestPath = resolveRequestPath(context);
        return settingFetcher.fetch(RightMenuSetting.GROUP, RightMenuSetting.class)
            .defaultIfEmpty(RightMenuSetting.defaults())
            .filter(RightMenuSetting::enabledOrDefault)
            .filter(setting -> RightMenuPathMatcher.matches(
                requestPath,
                setting.includePathsOrDefault(),
                setting.excludePathsOrDefault()
            ))
            .doOnNext(setting -> inject(context, model, setting))
            .onErrorResume(error -> {
                log.warn("[RightMenu] inject theme assets failed", error);
                return Mono.empty();
            })
            .then();
    }

    private void inject(ITemplateContext context, IModel model, RightMenuSetting setting) {
        IModelFactory modelFactory = context.getModelFactory();
        String version = pluginContext.getVersion();
        var postContext = RightMenuPostContextExtractor.extract(context);
        model.add(modelFactory.createText(RightMenuHtmlTpl.styleLink(version)));
        model.add(modelFactory.createText(RightMenuHtmlTpl.configScript(setting, postContext)));
        model.add(modelFactory.createText(RightMenuHtmlTpl.runtimeScript(version)));
    }

    private static String resolveRequestPath(ITemplateContext context) {
        if (!(context instanceof IWebContext webContext)) {
            return "/";
        }
        String requestUrl = webContext.getExchange().getRequest().getRequestURL();
        try {
            String rawPath = URI.create(requestUrl).getRawPath();
            return rawPath == null || rawPath.isBlank() ? "/" : rawPath;
        } catch (Exception ignored) {
            return "/";
        }
    }
}
