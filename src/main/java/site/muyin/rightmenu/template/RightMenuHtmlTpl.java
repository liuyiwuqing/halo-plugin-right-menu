package site.muyin.rightmenu.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import site.muyin.rightmenu.setting.RightMenuSetting;

/**
 * Theme-side right-menu HTML snippets.
 *
 * @author Lywq
 * @since 1.0.0
 */
public final class RightMenuHtmlTpl {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String ASSET_BASE_PATH = "/plugins/right-menu/assets/static/right-menu";

    private RightMenuHtmlTpl() {
    }

    public static String styleLink(String version) {
        return "\n<link id=\"right-menu-style\" href=\"%s/right-menu.css?version=%s\" rel=\"stylesheet\" />\n"
            .formatted(ASSET_BASE_PATH, version);
    }

    public static String configScript(RightMenuSetting setting) {
        return configScript(setting, null);
    }

    public static String configScript(RightMenuSetting setting, PostContext postContext) {
        try {
            String json = MAPPER.writeValueAsString(clientConfig(setting, postContext));
            return "\n<script id=\"right-menu-config\" type=\"application/json\">"
                + escapeInlineJson(json)
                + "</script>\n";
        } catch (Exception error) {
            return "";
        }
    }

    public static String runtimeScript(String version) {
        return "\n<script id=\"right-menu-runtime\" src=\"%s/right-menu.js?version=%s\" defer></script>\n"
            .formatted(ASSET_BASE_PATH, version);
    }

    private static Map<String, Object> clientConfig(RightMenuSetting rawSetting, PostContext postContext) {
        RightMenuSetting setting = rawSetting == null ? RightMenuSetting.defaults() : rawSetting;
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("enabled", setting.enabledOrDefault());
        config.put("includePaths", setting.includePathsOrDefault());
        config.put("excludePaths", setting.excludePathsOrDefault());
        config.put("pjaxCompatible", setting.pjaxCompatibleOrDefault());
        config.put("showNativeOnEditable", setting.showNativeOnEditableOrDefault());
        config.put("menuItems", setting.enabledMenuItems());
        config.put("style", setting.styleOrDefault());
        if (postContext != null && !isBlank(postContext.subjectName())) {
            config.put("currentPost", postContext);
        }
        return config;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String escapeInlineJson(String raw) {
        return raw
            .replace("&", "\\u0026")
            .replace("<", "\\u003c")
            .replace(">", "\\u003e");
    }

    public record PostContext(String subjectName, String subjectTitle, String permalink, String cover) {
    }
}
