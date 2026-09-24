require "minitest/autorun"

class DetailPagesTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  DETAIL_PAGES = %w[
    privacy/index.html
    terms/index.html
    account-deletion/index.html
    booklab/support/index.html
    upnow/support/index.html
    en/privacy/index.html
    en/terms/index.html
    en/account-deletion/index.html
    en/booklab/support/index.html
    en/upnow/support/index.html
    sleep/privacy/index.html
    sleep/terms/index.html
  ].freeze

  def built_page(path)
    File.read(File.join(ROOT, "_site", path))
  end

  def test_every_detail_page_uses_the_branded_shell
    DETAIL_PAGES.each do |path|
      html = built_page(path)

      assert_includes html, '<body class="detail-page">', path
      assert_includes html, 'class="home-header"', path
      assert_includes html, 'id="theme-toggle"', path
      assert_includes html, '/assets/css/detail.css', path
      assert_includes html, '/assets/js/home.js', path
    end
  end

  def test_english_detail_page_links_back_to_korean_counterpart
    html = built_page("en/privacy/index.html")

    assert_includes html, 'href="/privacy/"'
    assert_includes html, 'hreflang="ko"'
  end

  def test_home_location_is_bucheon_in_both_languages
    korean = built_page("index.html")
    english = built_page("en/index.html")

    assert_includes korean, "독립 제품 스튜디오 · 부천"
    assert_includes english, "Independent product studio · Bucheon"
    refute_includes korean, "서울"
    refute_includes english, "Seoul"
  end

  def test_sleep_policy_pages_query_sleep_specific_database_rows
    %w[privacy terms].each do |type|
      html = built_page("sleep/#{type}/index.html")

      assert_includes html, "data-policy-type=\"#{type}\""
      assert_includes html, 'data-policy-target="sleep"'
      assert_includes html, '/assets/js/app-policy.js'
    end

    script = File.read(File.join(ROOT, "assets/js/app-policy.js"))
    assert_includes script, "target: 'cs.{sleep}'"
    assert_includes script, "country: `eq.${country}`"
    assert_includes script, "window.location.pathname}?lang=${nextLanguage}"
  end
end
