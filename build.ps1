# Assembles index.html from the sources in src/, then mirrors the markup, CSS
# and JS into the WordPress theme so the two deliverables stay in step.
#
#   powershell -ExecutionPolicy Bypass -File build.ps1
#
# Edit src/_body.html, src/css/theme.css, or src/js/main.js.
# Never edit index.html, wordpress-theme/style.css, wordpress-theme/front-page.php
# or wordpress-theme/assets/js/main.js directly: all four are generated and will
# be overwritten.

$ErrorActionPreference = 'Stop'
$root  = Split-Path -Parent $MyInvocation.MyCommand.Path
$src   = Join-Path $root 'src'
$theme = Join-Path $root 'wordpress-theme'
$utf8  = New-Object System.Text.UTF8Encoding($false)

$css  = [System.IO.File]::ReadAllText((Join-Path $src 'css\theme.css'))
$js   = [System.IO.File]::ReadAllText((Join-Path $src 'js\main.js'))
$body = [System.IO.File]::ReadAllText((Join-Path $src '_body.html'))

# ---------------------------------------------------------------- index.html
$head = @'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AZ Garage Door | 24/7 Garage Door Repair in Phoenix, Scottsdale &amp; the Valley</title>
<meta name="description" content="Spring snapped, opener dead, or door off its track? AZ Garage Door has been fixing doors across Phoenix, Scottsdale, Tempe, Mesa and Chandler since 2011. Price on the phone, no trip fee, open 24 hours. Call 480-821-1111.">
<meta name="theme-color" content="#0A1A4F">
<link rel="icon" href="assets/images/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/images/favicon-180.png">
<meta property="og:type" content="website">
<meta property="og:title" content="AZ Garage Door | 24/7 Repair Across the Phoenix Valley">
<meta property="og:description" content="Same-day garage door repair in Phoenix and Scottsdale. Price quoted on the phone. Open 24 hours, same rate every hour.">
<meta property="og:image" content="assets/images/az-hero-poster.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
'@

$out = $head + $css + "`n</style>`n</head>`n<body>`n" + $body + "`n<script>`n" + $js + "`n</script>`n</body>`n</html>`n"
[System.IO.File]::WriteAllText((Join-Path $root 'index.html'), $out, $utf8)

# ---------------------------------------------------------------- theme JS
Copy-Item (Join-Path $src 'js\main.js') (Join-Path $theme 'assets\js\main.js') -Force

# ---------------------------------------------------------------- theme CSS
$themeHeader = @'
/*
Theme Name: AZ Garage Door
Theme URI: https://azgaragedoor.com/
Author: AZ Garage Door
Author URI: https://azgaragedoor.com/
Description: Conversion focused single page theme for AZ Garage Door, 24/7 garage door repair across Phoenix, Scottsdale, Tempe, Mesa and Chandler. Video hero with a quick-price widget, stats band, interactive door anatomy, symptom checker, pricing selector with spring estimator, work gallery and quote form. No plugin dependencies.
Version: 2.1.0
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: azgd
Tags: one-column, custom-logo, custom-menu, translation-ready
*/

/* WordPress admin bar offset for the fixed header. */
body.admin-bar .hdr{top:32px}
@media screen and (max-width:782px){body.admin-bar .hdr{top:46px}}

'@
[System.IO.File]::WriteAllText((Join-Path $theme 'style.css'), $themeHeader + $css, $utf8)

# ---------------------------------------------------------------- front-page.php
# The same markup as index.html, with asset URLs and repeated business details
# swapped for the theme helpers defined in functions.php.
$php = $body

# assets/... -> azgd_asset('...')
$php = [regex]::Replace($php, '(?<attr>src|href|poster)="assets/(?<path>[^"]+)"', {
    param($m)
    "$($m.Groups['attr'].Value)=`"<?php echo esc_url( azgd_asset( '$($m.Groups['path'].Value)' ) ); ?>`""
})

# logo images -> azgd_logo() so a Customizer logo can override the bundled file
$php = $php -replace '<img src="<\?php echo esc_url\( azgd_asset\( ''images/az-logo\.png'' \) \); \?>" alt="AZ Garage Door" width="240" height="80">', '<?php azgd_logo( 240, 80, ''AZ Garage Door'' ); ?>'
$php = $php -replace '<img src="<\?php echo esc_url\( azgd_asset\( ''images/az-logo\.png'' \) \); \?>" alt="AZ Garage Door" width="240" height="80" loading="lazy">', '<?php azgd_logo( 240, 80, ''AZ Garage Door'', ''lazy'' ); ?>'

# contact details -> filterable helpers
$php = $php -replace 'href="tel:\+14808211111"', 'href="tel:<?php echo esc_attr( azgd_info( ''phone_href'' ) ); ?>"'
$php = $php -replace 'href="sms:\+14808211111"', 'href="sms:<?php echo esc_attr( azgd_info( ''phone_href'' ) ); ?>"'
$php = $php -replace '480-821-1111', '<?php echo esc_html( azgd_info( ''phone'' ) ); ?>'
$php = $php -replace 'href="https://www\.facebook\.com/azgaragedoorrepair"', 'href="<?php echo esc_url( azgd_info( ''facebook'' ) ); ?>"'
$php = $php -replace 'href="#top" aria-label="AZ Garage Door, back to top"', 'href="<?php echo esc_url( home_url( ''/'' ) ); ?>#top" aria-label="AZ Garage Door, back to top"'

# menus -> wp_nav_menu with a section-link fallback
$php = [regex]::Replace($php, '(?s)<ul class="nav__list" id="navList">.*?</ul>', '<?php azgd_primary_nav(); ?>', 1)
$php = [regex]::Replace($php, '(?s)<ul class="mnav__list">.*?</ul>', '<?php azgd_mobile_nav(); ?>', 1)

# copyright year
$php = $php -replace '<span id="yr">\d{4}</span>', '<?php echo esc_html( gmdate( ''Y'' ) ); ?>'

# quote form posts back with a nonce so it still works without JavaScript
$php = $php.Replace(
    '<form class="form" id="quoteForm" novalidate>',
    '<form class="form" id="quoteForm" method="post" action="<?php echo esc_url( home_url( ''/'' ) ); ?>#quote" novalidate>' + "`r`n" +
    '          <?php wp_nonce_field( ''azgd_quote'', ''azgd_nonce'' ); ?>' + "`r`n" +
    '          <input type="hidden" name="azgd_quote" value="1">')
$php = $php.Replace(
    '<div class="form__ok" id="formOk" role="status" aria-live="polite">',
    '<div class="form__ok<?php echo ( ''sent'' === $azgd_quote_status ) ? '' on'' : ''''; ?>" id="formOk" role="status" aria-live="polite">')

$phpHead = @'
<?php
/**
 * Front page template for AZ Garage Door.
 *
 * GENERATED by build.ps1 from src/_body.html. Do not edit directly.
 *
 * Single page: video hero with quick-price widget, stats band, door anatomy
 * explorer, about timeline, symptom checker, services, how it works, pricing
 * with spring estimator, urgent band, work gallery, service areas,
 * testimonials, FAQ, quote form and footer.
 *
 * @package azgd
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$azgd_quote_status = isset( $_GET['quote'] ) ? sanitize_key( wp_unslash( $_GET['quote'] ) ) : '';
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

'@
[System.IO.File]::WriteAllText((Join-Path $theme 'front-page.php'),
    $phpHead + $php + "`r`n`r`n<?php wp_footer(); ?>`r`n</body>`r`n</html>`r`n", $utf8)

# ---------------------------------------------------------------- theme assets
# Keep the theme's own copy of the images and video in step with assets/.
foreach ($pair in @(
    @{ From = 'images'; To = 'assets\images' },
    @{ From = 'video';  To = 'assets\video'  }
)) {
    $dest = Join-Path $theme $pair.To
    if ( -not (Test-Path $dest) ) { New-Item -ItemType Directory -Force -Path $dest | Out-Null }
    Copy-Item (Join-Path $root "assets\$($pair.From)\*") $dest -Recurse -Force
}

$kb = [math]::Round((Get-Item (Join-Path $root 'index.html')).Length / 1KB, 1)
Write-Output "built index.html ($kb KB), front-page.php, theme css + js, and synced theme assets"
