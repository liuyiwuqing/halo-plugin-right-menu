package site.muyin.rightmenu.support;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Matches theme request paths against right-menu include and exclude rules.
 *
 * @author Lywq
 * @since 1.0.0
 */
public final class RightMenuPathMatcher {

    private RightMenuPathMatcher() {
    }

    public static boolean matches(String requestPath, List<String> includeRules, List<String> excludeRules) {
        String normalizedPath = normalizePath(requestPath);
        if (normalizedPath.isBlank()) {
            return false;
        }
        if (!isBlankRules(excludeRules) && excludeRules.stream()
            .filter(rule -> rule != null && !rule.isBlank())
            .anyMatch(rule -> matchesRule(normalizedPath, rule.trim()))) {
            return false;
        }
        if (isBlankRules(includeRules)) {
            return true;
        }
        return includeRules.stream()
            .filter(rule -> rule != null && !rule.isBlank())
            .anyMatch(rule -> matchesRule(normalizedPath, rule.trim()));
    }

    private static boolean isBlankRules(List<String> rules) {
        return rules == null || rules.stream().allMatch(rule -> rule == null || rule.isBlank());
    }

    private static boolean matchesRule(String requestPath, String rule) {
        if (rule.equals(requestPath)) {
            return true;
        }
        if (rule.endsWith("/**")) {
            String prefix = rule.substring(0, rule.length() - 3);
            return requestPath.equals(prefix) || requestPath.startsWith(prefix + "/");
        }
        if (rule.endsWith("/*")) {
            String prefix = rule.substring(0, rule.length() - 2);
            if (!requestPath.startsWith(prefix + "/")) {
                return false;
            }
            String remainingPath = requestPath.substring(prefix.length() + 1);
            return !remainingPath.isBlank() && !remainingPath.contains("/");
        }
        if (rule.contains("{") && rule.contains("}")) {
            return Pattern.compile(toPathVariableRegex(rule)).matcher(requestPath).matches();
        }
        return false;
    }

    private static String toPathVariableRegex(String rule) {
        StringBuilder regex = new StringBuilder("^");
        StringBuilder literal = new StringBuilder();
        boolean inVariable = false;
        for (int index = 0; index < rule.length(); index++) {
            char current = rule.charAt(index);
            if (current == '{') {
                regex.append(Pattern.quote(literal.toString())).append("[^/]+");
                literal.setLength(0);
                inVariable = true;
            } else if (current == '}' && inVariable) {
                inVariable = false;
            } else if (!inVariable) {
                literal.append(current);
            }
        }
        regex.append(Pattern.quote(literal.toString())).append("$");
        return regex.toString();
    }

    private static String normalizePath(String requestPath) {
        if (requestPath == null || requestPath.isBlank()) {
            return "";
        }
        String path = requestPath.trim();
        int queryIndex = path.indexOf('?');
        if (queryIndex >= 0) {
            path = path.substring(0, queryIndex);
        }
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return path;
    }
}
