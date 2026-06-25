# OpenSprout ProGuard / R8 Rules
# minSdkVersion 24, targetSdkVersion 36

# ── Capacitor Core ────────────────────────────────────────────────────────────
# Capacitor bridges JS<->Java via reflection — keep all plugin classes
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }

# Capacitor plugins
-keep class com.getcapacitor.plugin.** { *; }
-keep class com.getcapacitor.community.** { *; }
-keep class com.capacitorjs.** { *; }

# ── Plugin-specific keep rules ───────────────────────────────────────────────
# Camera
-keep class com.getcapacitor.plugin.camera.** { *; }

# Local Notifications
-keep class com.getcapacitor.plugin.localnotifications.** { *; }

# App
-keep class com.getcapacitor.plugin.app.** { *; }

# ── WebView / JavaScript Interface ───────────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Supabase / Kotlin serialization ──────────────────────────────────────────
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

# ── General Android ──────────────────────────────────────────────────────────
-keepattributes Signature
-keepattributes Exceptions

# Keep source file info and line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep annotations on all classes
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations
