package com.example.axialegal.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = AxiaGold,
    onPrimary = DarkBackground,
    primaryContainer = AxiaGoldDim,
    onPrimaryContainer = AxiaGoldLight,
    secondary = CourtBlue,
    onSecondary = DarkBackground,
    secondaryContainer = CourtBlueDim,
    onSecondaryContainer = CourtBlue,
    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkSurfaceElevated,
    onSurfaceVariant = TextSecondary,
    outline = DarkSurfaceBorder,
    error = AlertRed,
    onError = TextPrimary
)

private val LightColorScheme = lightColorScheme(
    primary = AxiaGold,
    onPrimary = TextPrimary,
    primaryContainer = AxiaGoldDim,
    onPrimaryContainer = DarkBackground,
    secondary = CourtBlue,
    onSecondary = TextPrimary,
    secondaryContainer = CourtBlueDim,
    onSecondaryContainer = DarkBackground,
    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkSurfaceElevated,
    onSurfaceVariant = TextSecondary,
    outline = DarkSurfaceBorder,
    error = AlertRed,
    onError = TextPrimary
)

@Composable
fun AxiaLegalTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
