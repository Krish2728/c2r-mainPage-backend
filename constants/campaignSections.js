const CAMPAIGN_SECTIONS = [
	{ id: "scholarship", label: "Scholarship" },
	{ id: "youth", label: "Youth & Students" },
	{ id: "mentorship", label: "Mentorship" },
	{ id: "skills", label: "Skills Training" },
	{ id: "livelihood", label: "Livelihood" },
	{ id: "health", label: "Health" },
	{ id: "education", label: "Education" },
];

const VALID_SECTION_IDS = new Set(CAMPAIGN_SECTIONS.map((s) => s.id));

function normalizeCategory(value) {
	const id = String(value || "education")
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-");
	return VALID_SECTION_IDS.has(id) ? id : "education";
}

function getSectionLabel(id) {
	const section = CAMPAIGN_SECTIONS.find((s) => s.id === id);
	return section ? section.label : "Education";
}

module.exports = {
	CAMPAIGN_SECTIONS,
	VALID_SECTION_IDS,
	normalizeCategory,
	getSectionLabel,
};
