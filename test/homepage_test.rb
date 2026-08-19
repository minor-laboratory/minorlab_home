require "minitest/autorun"

class HomepageTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)

  def built_page(path)
    File.read(File.join(ROOT, "_site", path))
  end

  def source(path)
    File.read(File.join(ROOT, path))
  end

  def test_korean_home_uses_editorial_homepage
    html = built_page("index.html")

    assert_includes html, '<body class="homepage">'
    assert_includes html, "Small habits."
    assert_includes html, 'id="apps-content"'
    assert_includes html, '/assets/css/home.css'
    assert_includes html, '/assets/js/home.js'
  end

  def test_english_home_uses_the_same_localized_structure
    html = built_page("en/index.html")

    assert_includes html, '<html lang="en">'
    assert_includes html, "We notice the small moments"
    assert_includes html, 'href="/"'
    assert_includes html, 'id="apps-content"'
  end

  def test_theme_is_applied_before_styles_and_exposed_as_a_control
    html = built_page("index.html")
    theme_script_position = html.index('localStorage.getItem("theme")')
    home_styles_position = html.index('/assets/css/home.css')

    refute_nil theme_script_position
    refute_nil home_styles_position
    assert_operator theme_script_position, :<, home_styles_position
    assert_includes html, 'id="theme-toggle"'
    assert_includes html, 'aria-pressed="false"'
  end

  def test_contact_cta_uses_the_studio_inquiry_address
    korean_html = built_page("index.html")
    english_html = built_page("en/index.html")

    assert_includes korean_html, 'href="mailto:hello@minorlab.com?subject=MinorLab%20%EB%AC%B8%EC%9D%98"'
    assert_includes english_html, 'href="mailto:hello@minorlab.com?subject=MinorLab%20inquiry"'
    assert_includes korean_html, "hello@minorlab.com"
  end

  def test_brand_mark_preserves_the_original_straight_banded_shape
    korean_html = built_page("index.html")
    home_css = source("assets/css/home.css")
    brand_mark = source("assets/images/brand-mark.svg")
    favicon = source("assets/images/favicon.svg")

    assert_includes korean_html, 'src="/assets/images/brand-mark.svg"'
    assert_includes korean_html, '<div class="home-hero-shape" aria-hidden="true"></div>'
    refute_includes korean_html, '<img class="home-hero-shape"'
    assert_includes home_css, "border-radius: 67% 33% 48% 52% / 34% 58% 42% 66%;"
    assert_includes home_css, "linear-gradient(145deg, #245bb5 0 52%, #18b7dc 52% 72%, #ff6b21 72%)"
    assert_includes home_css, "box-shadow: 18px 18px 0 var(--home-yellow);"
    assert_includes brand_mark, 'viewBox="0 0 64 64"'
    assert_includes brand_mark, '<linearGradient'
    assert_includes brand_mark, 'offset="52%"'
    assert_includes brand_mark, 'offset="72%"'
    assert_includes brand_mark, 'stroke-width="1.6"'
    assert_includes brand_mark, "#245BB5"
    assert_includes brand_mark, "#F5C443"
    assert_equal brand_mark, favicon
  end

  def test_home_assets_cover_theme_motion_and_fallback_apps
    css = source("assets/css/home.css")
    javascript = source("assets/js/home.js")

    assert_includes css, 'html[data-theme="dark"]'
    assert_includes css, "prefers-reduced-motion"
    assert_includes javascript, "IntersectionObserver"
    assert_includes javascript, 'localStorage.setItem("theme"'
    assert_includes javascript, "BookLab"
    assert_includes javascript, "UpNow"
  end
end
