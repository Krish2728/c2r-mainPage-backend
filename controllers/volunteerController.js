const { query } = require("../config/db");

const submitVolunteer = async (req, res) => {
	try {
		const {
			email,
			fullName,
			gender,
			mobileNo,
			dateOfBirth,
			currentAddress,
			nativeCityVillage,
			languages,
			currentCompanyOrg,
			designation,
			linkedinProfile,
			yearsOfExperience,
			hasVolunteeredBefore,
			highestQualification,
			howCanYouContribute,
			preferredAreasMentoring,
			hoursPerWeek,
			preferredDays,
			preferredTimings,
			identityNumber,
		} = req.body;

		if (!email || !fullName) {
			return res.status(400).json({ message: "Email and full name are required" });
		}

		await query(
			`INSERT INTO volunteer_submissions (
        email, full_name, gender, mobile_no, date_of_birth, current_address,
        native_city_village, languages, current_company_org, designation, linkedin_profile,
        years_of_experience, has_volunteered_before, highest_qualification, how_can_you_contribute,
        preferred_areas_mentoring, hours_per_week, preferred_days, preferred_timings, identity_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
			[
				email,
				fullName,
				gender || null,
				mobileNo || null,
				dateOfBirth || null,
				currentAddress || null,
				nativeCityVillage || null,
				languages || null,
				currentCompanyOrg || null,
				designation || null,
				linkedinProfile || null,
				yearsOfExperience || null,
				hasVolunteeredBefore || null,
				highestQualification || null,
				howCanYouContribute || null,
				preferredAreasMentoring || null,
				hoursPerWeek || null,
				preferredDays || null,
				preferredTimings || null,
				identityNumber || null,
			]
		);

		res.status(201).json({ message: "Thank you! Your volunteer registration has been submitted. We will be in touch." });
	} catch (err) {
		console.error("Volunteer submission error:", err);
		res.status(500).json({ message: "Failed to submit volunteer form" });
	}
};

module.exports = {
	submitVolunteer,
};
