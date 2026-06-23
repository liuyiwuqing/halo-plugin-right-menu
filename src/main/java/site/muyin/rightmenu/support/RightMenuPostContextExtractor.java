package site.muyin.rightmenu.support;

import java.lang.reflect.Method;
import lombok.experimental.UtilityClass;
import org.thymeleaf.context.ITemplateContext;
import site.muyin.rightmenu.template.RightMenuHtmlTpl;

/**
 * Extracts the current Halo post context for member favorite integration.
 *
 * @author Lywq
 * @since 1.0.0
 */
@UtilityClass
public class RightMenuPostContextExtractor {

    public static RightMenuHtmlTpl.PostContext extract(ITemplateContext context) {
        if (context == null) {
            return null;
        }
        return extract(context.getVariable("post"));
    }

    private static RightMenuHtmlTpl.PostContext extract(Object post) {
        if (post == null) {
            return null;
        }
        String subjectName = readNestedString(post, "metadata", "name");
        if (subjectName == null || subjectName.isBlank()) {
            return null;
        }
        return new RightMenuHtmlTpl.PostContext(
            subjectName,
            readNestedString(post, "spec", "title"),
            readNestedString(post, "status", "permalink"),
            readNestedString(post, "spec", "cover")
        );
    }

    private static String readNestedString(Object target, String firstProperty, String secondProperty) {
        Object first = readProperty(target, firstProperty);
        if (first == null) {
            return null;
        }
        Object second = readProperty(first, secondProperty);
        return second == null ? null : String.valueOf(second);
    }

    private static Object readProperty(Object target, String property) {
        if (target == null || property == null || property.isBlank()) {
            return null;
        }
        String methodName = "get" + Character.toUpperCase(property.charAt(0)) + property.substring(1);
        try {
            Method method = target.getClass().getMethod(methodName);
            return method.invoke(target);
        } catch (ReflectiveOperationException ignored) {
            return null;
        }
    }
}
