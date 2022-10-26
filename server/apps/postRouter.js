import { Router } from "express";
import { pool } from "../utils/db.js";

const postRouter = Router();

// View post by search category/keywords/all
postRouter.get("/", async (req, res) => {
  const category = req.query.category || "";
  const keywords = req.query.keywords || "";

  let query = "";
  let values = [];
  if (category && keywords) {
    query =
      "select * from posts inner join categories on posts.category_id = categories.category_id  where category_name=$1 and post_title ilike $2 ";
    values = [category, keywords];
  } else if (keywords) {
    query = "select * from posts where post_title ilike $1 ";
    values = [keywords];
  } else if (category) {
    query =
      "select * from posts inner join categories on posts.category_id = categories.category_id where category_name=$1 ";
    values = [category];
  } else {
    query =
      "select users.user_id,username,password,users_profile.user_profile_id,firstname,lastname,posts.post_id,post_title,post_content,media_file,post_by,created_at,answer_by,comment_id,share,upvote,downvote,category_name from users inner join users_profile on users_profile.user_id = users.user_id inner join posts on posts.post_by = users_profile.user_profile_id inner join categories on posts.category_id = categories.category_id order by user_id asc ";
    values = [];
  }

  const result = await pool.query(query, values);

  return res.json({
    data: result.rows,
  });
});

// view post by ID
postRouter.get("/:postId", async (req, res) => {
  const postId = req.params.postId;
  const result = await pool.query("select * from posts where post_id=$1", [
    postId,
  ]);

  return res.json({
    data: result.rows,
  });
});

// create new post
postRouter.post("/", async (req, res) => {
  const newPost = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
  };
  const category_input_id = await pool.query(
    "select * from categories where category_name ilike $1",
    [newPost.category]
  );
  const cat_id = category_input_id.rows[0].category_id;

  await pool.query(
    `insert into posts(post_title, post_content, media_file,category_id,post_by, created_at,updated_at, answer_by, share, post_vote )
    values ($1, $2, $3, $4, $5, $6, $7, $8,$9,$10)`,
    [
      newPost.post_title,
      newPost.post_content,
      newPost.media_file,
      cat_id,
      99,
      newPost.created_at,
      newPost.updated_at,
      150,
      0,
      0,
    ]
  );

  return res.json({
    message: "Post has been created.",
  });
});

// Update Post
postRouter.put("/:postId", async (req, res) => {
  const updatedPost = {
    ...req.body,
    updated_at: new Date(),
  };
  const postId = req.params.postId;
  const category_input_id = await pool.query(
    "select * from categories where category_name ilike $1",
    [updatedPost.category]
  );

  await pool.query(
    `UPDATE posts 
    SET post_title=$1,post_content=$2,media_file=$3,category_id=$4,updated_at=$5
    WHERE post_id=$6`,
    [
      updatedPost.post_title,
      updatedPost.post_content,
      updatedPost.media_file,
      category_input_id.rows[0].category_id,
      updatedPost.updated_at,
      postId,
    ]
  );

  return res.json({
    message: `Post ${postId} has been updated.`,
  });
});

// Delete Post
postRouter.delete("/:postId", async (req, res) => {
  const postId = req.params.postId;

  await pool.query(`delete from posts where post_id=$1`, [postId]);

  return res.json({
    message: `Post ${postId} has been deleted.`,
  });
});

// Comment to a post
postRouter.post("/:postId/comments", async (req, res) => {
  const postId = req.params.postId;
  const newComment = {
    ...req.body,
    post_id: postId,
    created_at: new Date(),
  };
  await pool.query(
    `insert into comments (user_profile_id, post_id,comment_content,comment_media,comment_vote,created_at)
    values ($1, $2, $3, $4, $5, $6)`,
    [
      2001,
      newComment.post_id,
      newComment.comment_content,
      newComment.comment_media,
      0,
      newComment.created_at,
    ]
  );

  return res.json({
    message: "Comment posted sucessfully!",
  });
});

// view comments by postId
postRouter.get("/:postId/comments", async (req, res) => {
  const postId = req.params.postId;
  const result = await pool.query("select * from comments where post_id =$1", [
    postId,
  ]);

  return res.json({
    data: result.rows,
  });
});

// vote post by id
postRouter.post("/:postId", async (req, res) => {
  const votePost = {
    ...req.body,
  };
  const postId = req.params.postId;
  const postVoteQuantityArr = await pool.query(
    "select post_vote_quantity from posts inner join posts_vote on posts.post_id = posts_vote.post_id where posts.post_id = $1",
    [postId]
  );
  let postVoteQuantity = postVoteQuantityArr.rows[0].post_vote_quantity;
  let newPostVoteQuantity = 0;
  console.log("vpq");
  console.log(postVoteQuantity);

  const ifHaveVoted = await pool.query(
    `select * from posts_vote where post_vote=$1 and user_profile_id = $2`,
    [votePost.post_vote, votePost.user_profile_id]
  );

  const haveUpvoted = ifHaveVoted.rows[0];

  console.log("haveUp");
  console.log(haveUpvoted);
  if (haveUpvoted === undefined) {
    await pool.query(
      `insert into posts_vote (user_profile_id,post_id,post_vote)
   values ($1, $2, $3)`,
      [votePost.user_profile_id, postId, votePost.post_vote]
    );
    if (votePost.post_vote === "true") {
      console.log("no have send true");
      newPostVoteQuantity = postVoteQuantity + 1;
    } else if (votePost.post_vote === "false") {
      console.log("no have send false");
      newPostVoteQuantity = postVoteQuantity - 1;
    }
  } else if (
    haveUpvoted.post_vote === votePost.post_vote &&
    haveUpvoted.post_vote !== undefined
  ) {
    console.log(" have no plus");
    newPostVoteQuantity = postVoteQuantity + 0;
  } else if (
    haveUpvoted.post_vote !== votePost.post_vote &&
    votePost.post_vote == true
  ) {
    await pool.query(
      `update post_vote set post_vote = $1 where user_profile_id = $2 `,
      [votePost.post_vote, votePost.user_profile_id]
    );
    console.log("have false send true");
    newPostVoteQuantity = postVoteQuantity + 1;
  } else if (
    haveUpvoted !== votePost.post_vote &&
    votePost.post_vote == false
  ) {
    await pool.query(
      `update post_vote set post_vote = $1 where user_profile_id = $2 `,
      [votePost.post_vote, votePost.user_profile_id]
    );
    console.log("have true send false");
    newPostVoteQuantity = postVoteQuantity - 1;
  }
  console.log("update");
  console.log(postVoteQuantity);
  postVoteQuantity = newPostVoteQuantity;
  await pool.query(
    `UPDATE posts
      SET post_vote_quantity=$1
      WHERE post_id=$2`,
    [newPostVoteQuantity, postId]
  );
  console.log(postVoteQuantity);
  console.log("postid:", postId);
  console.log("userid:", votePost.user_profile_id);

  return res.json({
    message: `Post Voted! ${postVoteQuantity}`,
  });
});
export default postRouter;
