package com.example.taskmanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/** ラベル表（labels）の1行。 */
@Entity
@Table(name = "labels")
public class Label {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 10, unique = true)
	private String name;

	@Column(name = "color_code", nullable = false, length = 7)
	private String colorCode;

	@Column(nullable = false)
	private Integer position;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false, insertable = false)
	private OffsetDateTime updatedAt;

	protected Label() {
	}

	public Long getId() { return id; }
	public String getName() { return name; }
	public String getColorCode() { return colorCode; }
	public Integer getPosition() { return position; }
	public OffsetDateTime getCreatedAt() { return createdAt; }
	public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
