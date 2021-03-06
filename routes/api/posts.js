const express = require("express");
const router = express.Router();
const passport = require("passport");

// Post model
const Post = require("../../models/Post");

// Validation
const validatePostInput = require("../../validation/post");
const validateCommentInput = require("../../validation/comment");

// @route GET api/posts
// @desc Tests posts route
// @access Public
router.get("/test", (req, res) => {
	res.json({
		msg: "Posts Works",
	});
});

// @route GET api/posts
// @desc Get post
// @access Public
router.get("/", (req, res) => {
	Post.find()
		.sort({ date: -1 })
		.then((posts) => res.json(posts))
		.catch((err) =>
			res.status(404).json({ nopostsfound: "There is no posts to show" })
		);
});

// @route GET api/posts/:id
// @desc Get post by id
// @access Public
router.get("/:id", (req, res) => {
	Post.findById(req.params.id)
		.sort({ date: -1 })
		.then((post) => {
			if (!post) {
				return res.status(404).json({ nopostfound: "cannot find that post" });
			}
			res.json(post);
		})
		.catch((err) =>
			res.status(404).json({ nopostfound: "that post doesn't exists" })
		);
});

// @route POST api/posts
// @desc Create post
// @access Private
router.post(
	"/",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validatePostInput(req.body);

		if (!isValid) {
			// If any errors, send 400 with err obj
			return res.status(400).json(errors);
		}

		const newPost = new Post({
			title: req.body.title,
			text: req.body.text,
			name: req.body.name,
			avatar: req.user.avatar,
			user: req.user.id,
		});

		newPost.save().then((post) => res.json(post));
	}
);

// @route PUT api/posts/:id
router.put(
	"/:id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validatePostInput(req.body);

		if (!isValid) {
			// If any errors, send 400 with err obj
			return res.status(400).json(errors);
		}

		// Get fields
		const postFields = { title: req.body.title, text: req.body.text };

		Post.findOne({ _id: req.params.id }).then((post) => {
			if (post) {
				// Update
				Post.findOneAndUpdate(
					{ _id: req.params.id },
					{ $set: postFields },
					{ new: true }
				).then((post) => res.json(post));
			} else {
				return res.status(404).json({
					post: "Post does not exists",
				});
			}
		});
	}
);

// @route DELETE api/posts/:id
// @desc Delete post
// @access Private
router.delete(
	"/:id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		Post.findById(req.params.id).then((post) => {
			if (!post) {
				return res.status(404).json({ postnotfound: "Not post found" });
			}

			// Check for post owner
			if (post.user.toString() !== req.user.id) {
				return res.status(401).json({ notauthorized: "User not authorized" });
			}

			// Delete
			post
				.remove()
				.then(() => res.json({ succes: true }))
				.catch((err) =>
					res.status(404).json({ postnotfound: "Not post found" })
				);
		});
	}
);

// @route Post api/posts/like/:id
// @desc Like post
// @access Private
router.post(
	"/like/:id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		Post.findById(req.params.id).then((post) => {
			if (
				post.likes.filter((like) => like.user.toString() === req.user.id)
					.length > 0
			) {
				return res
					.status(400)
					.json({ alreadyliked: "User already liked this post" });
			}

			// Add user id to likes array
			post.likes.unshift({ user: req.user.id });

			post.save().then((post) => res.json(post));
		});
	}
);

// @route POST api/posts/unlike/:id
// @desc Unlike post
// @access Private
router.post(
	"/unlike/:id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		Post.findById(req.params.id).then((post) => {
			if (
				post.likes.filter((like) => like.user.toString() === req.user.id)
					.length === 0
			) {
				return res
					.status(400)
					.json({ notliked: "You have not yet liked this post" });
			}

			// Get remove index
			const removeIndex = post.likes
				.map((like) => {
					like.user.toString();
				})
				.indexOf(req.user.id);

			// Splice out of array
			post.likes.splice(removeIndex);

			// Save
			post.save().then((post) => res.json(post));
		});
	}
);

// @route POST api/posts/comment/:id
// @desc Add comment to post
// @access Private
router.post(
	"/comment/:id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validateCommentInput(req.body);

		if (!isValid) {
			// If any errors, send 400 with err obj
			return res.status(400).json(errors);
		}

		Post.findById(req.params.id)
			.then((post) => {
				const newComment = {
					text: req.body.text,
					name: req.user.name,
					avatar: req.user.avatar,
					user: req.user.id,
				};

				// Add to comments array
				post.comments.unshift(newComment);

				// Save
				post.save().then((post) => res.json(post));
			})
			.catch((err) => res.status(404).json({ postnotfound: "No post found" }));
	}
);

// @route DELETE api/posts/comment/:id/comment_id
// @desc Remove comment from post
// @access Private
router.delete(
	"/comment/:id/:comment_id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		Post.findById(req.params.id)
			.then((post) => {
				// Check to see if comment exists
				if (
					post.comments.filter(
						(comment) => comment._id.toString() === req.params.comment_id
					).length === 0
				) {
					return res
						.status(404)
						.json({ commentnotexists: "Comment does not exist" });
				}

				// Get remove index
				const removeIndex = post.comments
					.map((item) => item._id.toString())
					.indexOf(req.params.comment_id);

				// Splice comment out of array
				post.comments.splice(removeIndex, 1);

				post.save().then((post) => res.json(post));
			})
			.catch((err) => res.status(404).json({ postnotfound: "No post found" }));
	}
);

module.exports = router;
