package site.muyin.rightmenu.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.experimental.Accessors;

/** AI 使用策略由本插件控制，模型和供应商凭据由 AI Foundation 管理。 */
@Data
@Accessors(chain = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class RightMenuAiSetting {
    public static final String GROUP = "ai";
    private Boolean enabled = false;
    private Boolean allowAnonymous = false;
    private String modelName;
    private Integer maxInputCharacters = 3000;
    private Integer maxOutputTokens = 800;
    private Integer requestsPerMinute = 3;
    private Integer requestsPerDay = 20;
    private Integer siteRequestsPerDay = 200;
    private Integer maxConcurrentRequests = 2;

    public boolean enabledOrDefault() { return Boolean.TRUE.equals(enabled); }
    public boolean allowAnonymousOrDefault() { return Boolean.TRUE.equals(allowAnonymous); }
    public int inputLimit() { return bounded(maxInputCharacters, 100, 6000, 3000); }
    public int outputLimit() { return bounded(maxOutputTokens, 100, 2000, 800); }
    public int minuteLimit() { return bounded(requestsPerMinute, 1, 20, 3); }
    public int dailyLimit() { return bounded(requestsPerDay, 1, 200, 20); }
    public int siteDailyLimit() { return bounded(siteRequestsPerDay, 1, 10000, 200); }
    public int concurrentLimit() { return bounded(maxConcurrentRequests, 1, 10, 2); }
    private static int bounded(Integer value, int min, int max, int fallback) {
        return value == null ? fallback : Math.min(max, Math.max(min, value));
    }
}
