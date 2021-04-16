const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = (data) => {
	let errors = {};

	data.text = !isEmpty(data.text) ? data.text : "";
	data.title = !isEmpty(data.title) ? data.title : "";

	if (Validator.isEmpty(data.text)) {
		errors.text = "Text is required";
	} else if (!Validator.isLength(data.text, { min: 10, max: 300 })) {
		errors.text = "post must be between 10 and 300 chars";
	}

	if (Validator.isEmpty(data.title)) {
		errors.title = "Title is required";
	} else if (!Validator.isLength(data.title, { min: 3, max: 120 })) {
		errors.title = "Title must be between 3 and 120 chars";
	}

	return { errors, isValid: isEmpty(errors) };
};
