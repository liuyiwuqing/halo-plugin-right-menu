package site.muyin.rightmenu.setting;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

class RightMenuSettingTest {
    @Test
    @SuppressWarnings("unchecked")
    void freshInstallDefaultsIncludeTheReadingTools() throws Exception {
        try (var input = getClass().getResourceAsStream("/extensions/settings.yaml")) {
            Map<String, Object> setting = new Yaml().load(input);
            var spec = (Map<String, Object>) setting.get("spec");
            var forms = (List<Map<String, Object>>) spec.get("forms");
            var general = forms.stream().filter(form -> "general".equals(form.get("group")))
                .findFirst().orElseThrow();
            // Halo initializes ConfigMap defaults from formSchema values, not form.value.
            var schema = (List<Map<String, Object>>) general.get("formSchema");
            var field = schema.stream().filter(node -> "menuItems".equals(node.get("name")))
                .findFirst().orElseThrow();
            var items = (List<Map<String, Object>>) field.get("value");
            assertThat(items).isNotEmpty();
            assertThat(items.stream().map(item -> item.get("action")).toList())
                .containsExactlyInAnyOrderElementsOf(RightMenuSetting.defaults().enabledMenuItems()
                    .stream().map(RightMenuSetting.MenuItem::getAction).toList());
        }
    }

    @Test
    void anExplicitEmptyMenuRemainsEmpty() {
        assertThat(RightMenuSetting.defaults().setMenuItems(List.of()).enabledMenuItems()).isEmpty();
    }
}
