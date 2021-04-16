const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = (data) => {
	let errors = {};

	data.text = !isEmpty(data.text) ? data.text : "";

	if (Validator.isEmpty(data.text)) {
		errors.text = "Text is required";
	} else if (!Validator.isLength(data.text, { min: 3, max: 300 })) {
		errors.text = "post must be between 3 and 300 chars";
	}

	return { errors, isValid: isEmpty(errors) };
};
