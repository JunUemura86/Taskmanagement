package com.example.taskmanagement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 画面（React）から API を呼べるようにする設定。
 *
 * 画面（http://localhost:5173）とサーバー（http://localhost:8080）は場所（オリジン）が違うため、
 * サーバーが許可しないと、ブラウザが API の呼び出しを止めてしまう（CORS というしくみ）。
 * 自分のパソコンの画面からの呼び出しだけを許可する（どこからでも許可する「*」は使わない）。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

	/** 呼び出しを許可する画面の場所。 */
	private static final String[] ALLOWED_ORIGINS = {
			"http://localhost:5173",
			"http://127.0.0.1:5173",
	};

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**")
				.allowedOrigins(ALLOWED_ORIGINS)
				// これから作る追加・変更・削除の API でも使えるようにしておく
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE");
	}
}
