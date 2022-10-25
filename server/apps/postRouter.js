import { Router } from "express";
import { pool } from "../utils/db.js";

const postRouter = Router();

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
      "select * from posts inner join categories on posts.category_id = categories.category_id  where category_name=$1 ";
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

postRouter.get("/:postId", async (req, res) => {
  const postId = req.params.postId;
  const result = await pool.query("select * from posts where post_id=$1", [
    postId,
  ]);

  return res.json({
    data: result.rows,
  });
});

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
    `insert into posts(post_id, post_title, Post_content, media_file,category_id, post_by, created_at,updated_at, answer_by, comment_id, share, upvote, downvote)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10,$11,$12,$13)`,
    [
      1001,
      newPost.post_title,
      newPost.Post_content,
      newPost.media_file,
      cat_id,
      9999,
      newPost.created_at,
      newPost.updated_at,
      150,
      0,
      0,
      0,
      0,
    ]
  );

  return res.json({
    message: "Post has been created.",
  });
});

postRouter.put("/:postId", async (req, res) => {
  // const hasPublished = req.body.status === "published";

  const updatedPost = {
    ...req.body,
    updated_at: new Date(),
  };
  const postId = req.params.id;
  await pool.query(
    `UPDATE posts 
    SET post_title=$1,Postcontent=$2,media_file=$3,category=$4,updated_at=$5,
    WHERE post_id=$6`,
    [
      updatedPost.post_title,
      updatedPost.Post_content,
      updatedPost.media_file,
      updatedPost.category,
      updatedPost.updated_at,
      postId,
    ]
  );

  return res.json({
    message: `Post ${postId} has been updated.`,
  });
});

postRouter.delete("/:id", async (req, res) => {
  const postId = req.params.id;

  await pool.query(`delete from posts where post_id=$1`, [postId]);

  return res.json({
    message: `Post ${postId} has been deleted.`,
  });
});

export default postRouter;
