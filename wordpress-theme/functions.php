<?php
/**
 * AZ Garage Door theme functions.
 *
 * @package azgd
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AZGD_VERSION', '1.0.0' );

/**
 * Theme supports and menus.
 */
function azgd_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo', array(
		'height'      => 74,
		'width'       => 220,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'responsive-embeds' );

	register_nav_menus( array(
		'primary' => __( 'Primary menu', 'azgd' ),
		'footer'  => __( 'Footer menu', 'azgd' ),
	) );
}
add_action( 'after_setup_theme', 'azgd_setup' );

/**
 * Styles and scripts.
 */
function azgd_assets() {
	wp_enqueue_style(
		'azgd-fonts',
		'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style( 'azgd-style', get_stylesheet_uri(), array( 'azgd-fonts' ), AZGD_VERSION );

	wp_enqueue_script(
		'azgd-main',
		get_theme_file_uri( 'assets/main.js' ),
		array(),
		AZGD_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'azgd_assets' );

/**
 * Preconnect to the Google Fonts hosts.
 */
function azgd_resource_hints( $urls, $relation ) {
	if ( 'preconnect' === $relation ) {
		$urls[] = array( 'href' => 'https://fonts.googleapis.com' );
		$urls[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' => '' );
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'azgd_resource_hints', 10, 2 );

/**
 * Business details, filterable so they can be changed without editing the template.
 *
 * @param string $key Detail key.
 * @return string
 */
function azgd_info( $key ) {
	$info = array(
		'phone'      => '480-821-1111',
		'phone_href' => '+14808211111',
		'area'       => 'Phoenix & Scottsdale',
		'hours'      => 'Open 24 hours, 7 days',
		'facebook'   => 'https://www.facebook.com/azgaragedoorrepair',
	);

	/**
	 * Filters the AZ Garage Door business details.
	 *
	 * @param array $info Detail map.
	 */
	$info = apply_filters( 'azgd_info', $info );

	return isset( $info[ $key ] ) ? $info[ $key ] : '';
}

/**
 * Asset URL helper for theme images and video.
 *
 * @param string $file File name inside assets/.
 * @return string
 */
function azgd_asset( $file ) {
	return get_theme_file_uri( 'assets/' . ltrim( $file, '/' ) );
}

/**
 * Print the site logo: the custom logo when one is set, otherwise the bundled mark.
 *
 * @param int    $w     Width attribute.
 * @param int    $h     Height attribute.
 * @param string $alt   Alt text.
 * @param string $load  Loading attribute value.
 */
function azgd_logo( $w = 220, $h = 74, $alt = '', $load = 'eager' ) {
	$alt = '' === $alt ? get_bloginfo( 'name' ) : $alt;

	if ( has_custom_logo() ) {
		$id  = get_theme_mod( 'custom_logo' );
		$src = wp_get_attachment_image_url( $id, 'full' );
		if ( $src ) {
			printf(
				'<img src="%1$s" alt="%2$s" width="%3$d" height="%4$d" loading="%5$s">',
				esc_url( $src ),
				esc_attr( $alt ),
				(int) $w,
				(int) $h,
				esc_attr( $load )
			);
			return;
		}
	}

	printf(
		'<img src="%1$s" alt="%2$s" width="%3$d" height="%4$d" loading="%5$s">',
		esc_url( azgd_asset( 'images/az-logo.png' ) ),
		esc_attr( $alt ),
		(int) $w,
		(int) $h,
		esc_attr( $load )
	);
}

/**
 * Favicon tags, using the bundled files when no site icon is set in the Customizer.
 */
function azgd_favicons() {
	if ( has_site_icon() ) {
		return;
	}
	?>
	<link rel="icon" href="<?php echo esc_url( azgd_asset( 'images/favicon.ico' ) ); ?>" sizes="any">
	<link rel="icon" type="image/png" sizes="32x32" href="<?php echo esc_url( azgd_asset( 'images/favicon-32.png' ) ); ?>">
	<link rel="icon" type="image/png" sizes="16x16" href="<?php echo esc_url( azgd_asset( 'images/favicon-16.png' ) ); ?>">
	<link rel="apple-touch-icon" sizes="180x180" href="<?php echo esc_url( azgd_asset( 'images/favicon-180.png' ) ); ?>">
	<meta name="theme-color" content="#0E2470">
	<?php
}
add_action( 'wp_head', 'azgd_favicons', 5 );

/**
 * Description and social tags for the front page.
 */
function azgd_meta_tags() {
	if ( ! is_front_page() ) {
		return;
	}

	$desc = __( 'Garage door stuck, spring snapped, or opener dead? AZ Garage Door runs same-day repair across Phoenix and Scottsdale. Free estimates, no trip fee, flat price quoted before we start. Open 24 hours. Call 480-821-1111.', 'azgd' );
	?>
	<meta name="description" content="<?php echo esc_attr( $desc ); ?>">
	<meta property="og:type" content="website">
	<meta property="og:title" content="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
	<meta property="og:description" content="<?php echo esc_attr( $desc ); ?>">
	<meta property="og:image" content="<?php echo esc_url( azgd_asset( 'images/az-hero-poster.jpg' ) ); ?>">
	<?php
}
add_action( 'wp_head', 'azgd_meta_tags', 6 );

/**
 * LocalBusiness structured data for the front page.
 */
function azgd_schema() {
	if ( ! is_front_page() ) {
		return;
	}

	$schema = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'LocalBusiness',
		'name'        => get_bloginfo( 'name' ),
		'url'         => home_url( '/' ),
		'telephone'   => azgd_info( 'phone' ),
		'image'       => azgd_asset( 'images/az-logo.png' ),
		'priceRange'  => '$$',
		'areaServed'  => array(
			array( '@type' => 'City', 'name' => 'Phoenix', 'addressRegion' => 'AZ' ),
			array( '@type' => 'City', 'name' => 'Scottsdale', 'addressRegion' => 'AZ' ),
			array( '@type' => 'City', 'name' => 'Tempe', 'addressRegion' => 'AZ' ),
			array( '@type' => 'City', 'name' => 'Mesa', 'addressRegion' => 'AZ' ),
			array( '@type' => 'City', 'name' => 'Chandler', 'addressRegion' => 'AZ' ),
		),
		'openingHoursSpecification' => array(
			'@type'     => 'OpeningHoursSpecification',
			'dayOfWeek' => array( 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ),
			'opens'     => '00:00',
			'closes'    => '23:59',
		),
	);

	echo '<script type="application/ld+json">' . wp_json_encode( $schema ) . '</script>' . "\n";
}
add_action( 'wp_head', 'azgd_schema', 20 );

/**
 * The page's sections, used by both navigations.
 *
 * @return array Map of anchor => label.
 */
function azgd_sections() {
	return apply_filters( 'azgd_sections', array(
		'#help'     => __( 'Symptoms', 'azgd' ),
		'#services' => __( 'Services', 'azgd' ),
		'#pricing'  => __( 'Pricing', 'azgd' ),
		'#work'     => __( 'Our work', 'azgd' ),
		'#areas'    => __( 'Areas', 'azgd' ),
		'#reviews'  => __( 'Reviews', 'azgd' ),
		'#faq'      => __( 'FAQ', 'azgd' ),
	) );
}

/**
 * Desktop menu. The scroll spy in main.js keys off #navList, so the id stays
 * on the list whichever source the items come from.
 */
function azgd_primary_nav() {
	if ( has_nav_menu( 'primary' ) ) {
		wp_nav_menu( array(
			'theme_location' => 'primary',
			'container'      => false,
			'menu_class'     => 'nav__list',
			'menu_id'        => 'navList',
			'depth'          => 1,
			'fallback_cb'    => false,
		) );
		return;
	}

	echo '<ul class="nav__list" id="navList">';
	foreach ( azgd_sections() as $href => $label ) {
		printf( '<li><a href="%1$s">%2$s</a></li>', esc_attr( $href ), esc_html( $label ) );
	}
	echo '</ul>';
}

/**
 * Full-screen mobile menu, numbered to match the design.
 */
function azgd_mobile_nav() {
	$items = azgd_sections();
	$items['#quote'] = __( 'Contact', 'azgd' );

	echo '<ul class="mnav__list">';
	$i = 0;
	foreach ( $items as $href => $label ) {
		$i++;
		printf(
			'<li><a href="%1$s"><span class="mnav__n">%2$s</span>%3$s</a></li>',
			esc_attr( $href ),
			esc_html( sprintf( '%02d', $i ) ),
			esc_html( $label )
		);
	}
	echo '</ul>';
}

/**
 * Handle the quote form when it is posted without JavaScript.
 *
 * The browser validates and confirms inline in the normal case. This is the
 * no-script path: it checks the nonce, mails the request to the admin address,
 * and returns to the form with a status flag.
 */
function azgd_handle_quote() {
	if ( empty( $_POST['azgd_quote'] ) ) {
		return;
	}

	if ( ! isset( $_POST['azgd_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['azgd_nonce'] ) ), 'azgd_quote' ) ) {
		wp_safe_redirect( home_url( '/?quote=error#quote' ) );
		exit;
	}

	$name  = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$phone = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	$city  = isset( $_POST['city'] ) ? sanitize_text_field( wp_unslash( $_POST['city'] ) ) : '';
	$issue = isset( $_POST['issue'] ) ? sanitize_text_field( wp_unslash( $_POST['issue'] ) ) : '';
	$notes = isset( $_POST['notes'] ) ? sanitize_textarea_field( wp_unslash( $_POST['notes'] ) ) : '';

	$digits = preg_replace( '/\D/', '', $phone );

	if ( strlen( $name ) < 2 || strlen( $digits ) < 10 || '' === $city ) {
		wp_safe_redirect( home_url( '/?quote=invalid#quote' ) );
		exit;
	}

	$body = sprintf(
		"Name: %s\nPhone: %s\nCity: %s\nProblem: %s\n\nNotes:\n%s\n",
		$name,
		$phone,
		$city,
		'' === $issue ? 'Not specified' : $issue,
		'' === $notes ? 'None' : $notes
	);

	wp_mail(
		get_option( 'admin_email' ),
		sprintf( 'Quote request from %s (%s)', $name, $city ),
		$body
	);

	wp_safe_redirect( home_url( '/?quote=sent#quote' ) );
	exit;
}
add_action( 'template_redirect', 'azgd_handle_quote' );
