package site.muyin.rightmenu.template;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import site.muyin.rightmenu.setting.RightMenuSetting;

class RightMenuHtmlTplTest {

    @Test
    void escapesInlineJsonForScriptTagInjection() {
        var setting = RightMenuSetting.defaults();
        setting.setMenuItems(List.of(new RightMenuSetting.MenuItem()
            .setId("xss")
            .setLabel("</script><script>alert(1)</script>")
            .setAction("copyPageLink")
            .setEnabled(true)));

        String html = RightMenuHtmlTpl.configScript(setting);

        assertThat(html).contains("\\u003c/script\\u003e");
        assertThat(html).doesNotContain("</script><script>");
    }

    @Test
    void pointsStaticAssetsToHaloPluginStaticResourcePath() {
        assertThat(RightMenuHtmlTpl.styleLink("1.0.0-SNAPSHOT"))
            .contains("/plugins/right-menu/assets/static/right-menu/right-menu.css?version=1.0.0-SNAPSHOT");
        assertThat(RightMenuHtmlTpl.runtimeScript("1.0.0-SNAPSHOT"))
            .contains("/plugins/right-menu/assets/static/right-menu/right-menu.js?version=1.0.0-SNAPSHOT");
    }

    @Test
    void generatesDefaultIdentifierForCustomMenuItemWhenMissing() {
        var setting = RightMenuSetting.defaults();
        var menuItem = new RightMenuSetting.MenuItem()
            .setLabel("搜索")
            .setAction("search")
            .setIcon("ri:search-line")
            .setEnabled(true);
        setting.setMenuItems(List.of(menuItem));

        var enabledItems = setting.enabledMenuItems();

        assertThat(enabledItems).singleElement().satisfies(item ->
            assertThat(item.getId()).startsWith("menu-").hasSize(17)
        );
        assertThat(menuItem.getId()).isNull();
    }

    @Test
    void defaultMenuItemsIncludeOptionalPluginIntegrations() {
        var setting = RightMenuSetting.defaults();

        assertThat(setting.enabledMenuItems())
            .extracting(RightMenuSetting.MenuItem::getAction)
            .contains("memberFavorite", "memberSignIn", "openLinksSubmit");
    }

    @Test
    void embedsCurrentPostContextForMemberFavoriteAction() {
        var postContext = new RightMenuHtmlTpl.PostContext(
            "post-a",
            "文章 A",
            "https://example.com/archives/post-a",
            "https://example.com/cover.png"
        );

        String html = RightMenuHtmlTpl.configScript(RightMenuSetting.defaults(), postContext);

        assertThat(html).contains("\"currentPost\"");
        assertThat(html).contains("\"subjectName\":\"post-a\"");
        assertThat(html).contains("\"subjectTitle\":\"文章 A\"");
    }

    @Test
    void embedsPathRulesForPjaxRuntimePathChecks() {
        var setting = RightMenuSetting.defaults()
            .setIncludePaths(List.of("/posts/**"))
            .setExcludePaths(List.of("/posts/private/**"));

        String html = RightMenuHtmlTpl.configScript(setting);

        assertThat(html).contains("\"includePaths\":[\"/posts/**\"]");
        assertThat(html).contains("\"excludePaths\":[\"/posts/private/**\"]");
    }
}
