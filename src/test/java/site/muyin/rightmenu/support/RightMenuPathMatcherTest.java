package site.muyin.rightmenu.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class RightMenuPathMatcherTest {

    @Test
    void matchesAllPathsWhenRulesAreEmpty() {
        assertThat(RightMenuPathMatcher.matches("/posts/hello", List.of(), List.of())).isTrue();
    }

    @Test
    void matchesCommonThemePathRules() {
        assertThat(RightMenuPathMatcher.matches("/posts/hello", List.of("/posts/{slug}"), List.of()))
            .isTrue();
        assertThat(RightMenuPathMatcher.matches("/archives/2026/06", List.of("/archives/**"), List.of()))
            .isTrue();
        assertThat(RightMenuPathMatcher.matches("/photos/cat", List.of("/photos/*"), List.of()))
            .isTrue();
        assertThat(RightMenuPathMatcher.matches("/photos/2026/cat", List.of("/photos/*"), List.of()))
            .isFalse();
    }

    @Test
    void excludesTakePrecedenceOverIncludedRules() {
        assertThat(RightMenuPathMatcher.matches(
            "/posts/secret?preview=true",
            List.of("/posts/**"),
            List.of("/posts/secret")
        )).isFalse();
    }
}
