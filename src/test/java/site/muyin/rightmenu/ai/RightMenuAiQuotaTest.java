package site.muyin.rightmenu.ai;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class RightMenuAiQuotaTest {
    @Test
    void limitsConcurrencyPerIdentityAndReleasesOnlyOnce() {
        var quota = new RightMenuAiQuota();
        var setting = new RightMenuAiSetting().setMaxConcurrentRequests(2);
        var first = quota.acquire("user:a", setting);
        var second = quota.acquire("user:b", setting);
        limited(() -> quota.acquire("user:a", setting));
        limited(() -> quota.acquire("user:c", setting));
        first.run();
        first.run();
        var third = quota.acquire("user:c", setting);
        limited(() -> quota.acquire("user:d", setting));
        second.run();
        third.run();
        quota.acquire("user:a", setting).run();
    }

    @Test
    void resetsMinuteCountsWhileKeepingDailyCounts() {
        var clock = new MutableClock(Instant.parse("2026-10-11T01:00:00Z"));
        var quota = new RightMenuAiQuota(clock);
        var setting = new RightMenuAiSetting().setRequestsPerMinute(2).setRequestsPerDay(3);
        quota.acquire("user:a", setting).run();
        quota.acquire("user:a", setting).run();
        limited(() -> quota.acquire("user:a", setting));
        clock.now = clock.now.plusSeconds(61);
        quota.acquire("user:a", setting).run();
        clock.now = clock.now.plusSeconds(61);
        limited(() -> quota.acquire("user:a", setting));
        quota.acquire("user:b", setting).run();
    }

    @Test
    void resetsTheSiteBudgetAtMidnightInShanghai() {
        var clock = new MutableClock(Instant.parse("2026-10-11T15:59:00Z"));
        var quota = new RightMenuAiQuota(clock);
        var setting = new RightMenuAiSetting().setSiteRequestsPerDay(1);
        quota.acquire("visitor:address-a", setting).run();
        limited(() -> quota.acquire("visitor:address-b", setting));
        clock.now = clock.now.plusSeconds(120);
        quota.acquire("visitor:address-b", setting).run();
        limited(() -> quota.acquire("visitor:address-a", setting));
    }

    private static void limited(Runnable request) {
        assertThatThrownBy(request::run).isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("429");
    }

    private static final class MutableClock extends Clock {
        private Instant now;
        private MutableClock(Instant now) { this.now = now; }
        @Override public ZoneId getZone() { return ZoneId.of("UTC"); }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(now, zone); }
        @Override public Instant instant() { return now; }
    }
}
