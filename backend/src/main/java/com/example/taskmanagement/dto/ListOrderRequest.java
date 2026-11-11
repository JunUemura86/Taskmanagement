package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * リストを並べ替えたあとの順番（UC-13）。左から順に、リストの ID を並べる。
 * 今あるリストを、ちょうど全部（最大10個）含めて送る。
 */
public record ListOrderRequest(
		@NotNull @Size(max = 10) List<@NotNull Long> listIds) {
}
