<?php
/**
 * Fallback template.
 *
 * The site is a single landing page, so anything that is not the front page
 * is redirected home rather than rendered as a blog archive.
 *
 * @package azgd
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

wp_safe_redirect( home_url( '/' ) );
exit;
