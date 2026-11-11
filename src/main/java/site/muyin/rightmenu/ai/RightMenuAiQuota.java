package site.muyin.rightmenu.ai;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** 仅保存计数；重启后额度重置。短临界区不执行模型调用或其他 I/O。 */
@Component
public class RightMenuAiQuota {
    private final Clock clock;
    private final Map<String, Counter> counters = new HashMap<>();
    private LocalDate day;
    private int siteCount;
    private int active;
    private final Map<String, Integer> activeUsers = new HashMap<>();

    public RightMenuAiQuota() { this(Clock.systemUTC()); }
    RightMenuAiQuota(Clock clock) { this.clock = clock; }

    public synchronized Runnable acquire(String identity, RightMenuAiSetting setting) {
        LocalDate today = LocalDate.now(clock.withZone(ZoneId.of("Asia/Shanghai")));
        if (!today.equals(day)) { counters.clear(); siteCount = 0; day = today; }
        if (active >= setting.concurrentLimit() || activeUsers.containsKey(identity)) {
            throw limited("正在生成，请稍后再试");
        }
        long minute = clock.millis() / 60000;
        Counter counter = counters.get(identity);
        if (counter == null) {
            if (counters.size() >= 10000) { throw limited("站点 AI 访问额度已满"); }
            counter = new Counter();
        }
        if (counter.minute != minute) { counter.minute = minute; counter.minuteCount = 0; }
        if (counter.minuteCount >= setting.minuteLimit() || counter.dailyCount >= setting.dailyLimit()
            || siteCount >= setting.siteDailyLimit()) {
            throw limited("AI 使用次数已达限额，请稍后再试");
        }
        counter.minuteCount++;
        counter.dailyCount++;
        counters.put(identity, counter);
        siteCount++;
        active++;
        activeUsers.put(identity, 1);
        var released = new AtomicBoolean();
        return () -> { if (released.compareAndSet(false, true)) { release(identity); } };
    }
    private synchronized void release(String identity) { active--; activeUsers.remove(identity); }
    private static ResponseStatusException limited(String message) { return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, message); }
    private static class Counter { long minute = -1; int minuteCount; int dailyCount; }
}
