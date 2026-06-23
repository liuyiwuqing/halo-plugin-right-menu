package site.muyin.rightmenu.setting;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.Data;
import lombok.experimental.Accessors;

/**
 * 全能右键配置。
 *
 * @author Lywq
 * @since 1.0.0
 */
@Data
@Accessors(chain = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class RightMenuSetting {

    public static final String SETTING_NAME = "plugin-right-menu-settings";
    public static final String CONFIG_MAP_NAME = "plugin-right-menu-configmap";
    public static final String GROUP = "general";

    private Boolean enabled = true;
    private List<String> includePaths = List.of();
    private List<String> excludePaths = List.of("/console/**", "/uc/**", "/apis/**");
    private Boolean pjaxCompatible = true;
    private Boolean showNativeOnEditable = true;
    private Style style = new Style();
    private List<MenuItem> menuItems = defaultMenuItems();

    public static RightMenuSetting defaults() {
        return new RightMenuSetting();
    }

    public boolean enabledOrDefault() {
        return !Boolean.FALSE.equals(enabled);
    }

    public boolean pjaxCompatibleOrDefault() {
        return !Boolean.FALSE.equals(pjaxCompatible);
    }

    public boolean showNativeOnEditableOrDefault() {
        return !Boolean.FALSE.equals(showNativeOnEditable);
    }

    public List<String> includePathsOrDefault() {
        return includePaths == null ? List.of() : includePaths;
    }

    public List<String> excludePathsOrDefault() {
        return excludePaths == null ? List.of() : excludePaths;
    }

    public Style styleOrDefault() {
        return style == null ? new Style() : style;
    }

    public List<MenuItem> enabledMenuItems() {
        List<MenuItem> items = menuItems == null || menuItems.isEmpty() ? defaultMenuItems() : menuItems;
        return items.stream()
            .filter(MenuItem::enabledOrDefault)
            .map(RightMenuSetting::withDefaultIdentifier)
            .sorted(Comparator.comparingInt(MenuItem::orderOrDefault))
            .toList();
    }

    private static MenuItem withDefaultIdentifier(MenuItem item) {
        return new MenuItem()
            .setId(defaultIdentifier(item.getId()))
            .setLabel(item.getLabel())
            .setAction(item.getAction())
            .setIcon(item.getIcon())
            .setContext(item.getContext())
            .setUrl(item.getUrl())
            .setTarget(item.getTarget())
            .setEnabled(item.getEnabled())
            .setOrder(item.getOrder());
    }

    private static String defaultIdentifier(String id) {
        if (id != null && !id.isBlank()) {
            return id;
        }
        return "menu-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private static List<MenuItem> defaultMenuItems() {
        return List.of(
            item("copy-page-link", "复制链接", "copyPageLink", "ri:link", "common", 10),
            item("copy-page-title-link", "复制标题和链接", "copyPageTitleLink", "ri:file-copy-line", "common", 20),
            item("copy-selection", "复制选中文本", "copySelection", "ri:text", "text", 30),
            item("copy-image-url", "复制图片地址", "copyImageUrl", "ri:image-line", "image", 40),
            item("open-image", "打开图片", "openImage", "ri:external-link-line", "image", 50),
            item("copy-link-url", "复制链接地址", "copyLinkUrl", "ri:links-line", "link", 60),
            item("open-link", "打开链接", "openLink", "ri:external-link-line", "link", 70),
            item("scroll-top", "返回顶部", "scrollTop", "ri:arrow-up-line", "common", 80),
            item("reload", "刷新页面", "reload", "ri:refresh-line", "common", 90),
            item("home", "返回首页", "home", "ri:home-4-line", "common", 100),
            item("member-favorite", "会员收藏", "memberFavorite", "ri:star-line", "common", 110),
            item("member-sign-in", "会员签到", "memberSignIn", "ri:calendar-check-line", "common", 120),
            item("open-links-submit", "申请友链", "openLinksSubmit", "ri:links-fill", "common", 130)
        );
    }

    private static MenuItem item(String id, String label, String action, String icon, String context, int order) {
        return new MenuItem()
            .setId(id)
            .setLabel(label)
            .setAction(action)
            .setIcon(icon)
            .setContext(context)
            .setOrder(order)
            .setEnabled(true)
            .setTarget("_self");
    }

    @Data
    @Accessors(chain = true)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MenuItem {
        private String id;
        private String label;
        private String action;
        private String icon;
        private String context = "common";
        private String url;
        private String target = "_self";
        private Boolean enabled = true;
        private Integer order = 0;

        public boolean enabledOrDefault() {
            return !Boolean.FALSE.equals(enabled);
        }

        public int orderOrDefault() {
            return order == null ? 0 : order;
        }
    }

    @Data
    @Accessors(chain = true)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Style {
        private String theme = "auto";
        private String primaryColor = "#111827";
        private Integer menuWidth = 220;
        private Integer borderRadius = 8;
    }
}
