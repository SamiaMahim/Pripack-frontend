import { useContext, useEffect, useState } from "react";
import { ThumbsUp } from 'lucide-react';
import {base_url} from '../../config/config.jsx'
import { AuthContext } from '../Auth/Authprovider';
const Comments = ({ productId }) => {
  const { user } = useContext(AuthContext);
  const displayName = user?.name || user?.remail || "Guest User";

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);

  const fetchComments = async () => {
    const res = await fetch(
      `${base_url}/comments/${productId}`
    );
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => {
    if (productId) fetchComments();
  }, [productId]);


  const addComment = async () => {
    if (!newComment.trim()) return;

    await fetch(`${base_url}/addcomment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        userName: displayName,
        message: newComment,
      }),
    });

    setNewComment("");
    fetchComments();
  };

  const likeComment = async (commentId) => {
    await fetch(
      `${base_url}/likecomment/${commentId}`,
      { method: "PATCH" }
    );
    fetchComments();
  };
  const addReply = async (commentId) => {
    if (!replyText.trim()) return;

    await fetch(
      `${base_url}/replycomment/${commentId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: displayName,
          message: replyText,
        }),
      }
    );

    setReplyText("");
    setActiveReplyId(null);
    fetchComments();
  };

  const likeReply = async (commentId, replyId) => {
    await fetch(
      `${base_url}/likereply/${commentId}/${replyId}`,
      { method: "PATCH" }
    );
    fetchComments();
  };

  return (
    <div className="w-full ">
      <h2 className="text-xl font-bold text-teal-500  mb-2">
        Comments
      </h2>

      <div className="mb-4">
        <textarea
          className="w-full border rounded p-2 text-sm"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          onClick={addComment}
          className="mt-2 h-8 w-24 rounded-lg text-sm font-semibold shadow-md border-[1px] hover:bg-teal-500 hover:text-white border-teal-500 hover:border-teal-600 text-teal-600 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          Comment
        </button>
      </div>

   

      {comments.map((comment) => (
        <div key={comment._id} className="mb-4">

       
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-sm font-semibold">{comment.userName}</p>
            <p className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </p>

            <p className="text-sm mt-2">{comment.message}</p>

            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <button
                onClick={() => likeComment(comment._id)}
                className="flex items-center gap-1 hover:text-teal-600"
              >
                <ThumbsUp size={14} />
                {comment.likes}
              </button>

              <button
                onClick={() =>
                  setActiveReplyId(
                    activeReplyId === comment._id ? null : comment._id
                  )
                }
                className="hover:text-gray-800"
              >
                Reply
              </button>
            </div>
          </div>

        
          {activeReplyId === comment._id && (
            <div className="ml-6 mt-2">
              <textarea
                className="w-full border rounded p-2 text-sm"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button
                onClick={() => addReply(comment._id)}
                className="btn-simple mt-1 px-3 py-1 text-xs"
              >
                Post Reply
              </button>
            </div>
          )}

      
      
          {comment.replies?.length > 0 && (
            <div className="ml-6 mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <div
                  key={reply._id}
                  className="bg-gray-50 p-3 rounded-lg border"
                >
                  <p className="text-sm font-semibold">{reply.userName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </p>

                  <p className="text-sm mt-1">{reply.message}</p>

                  <button
                    onClick={() =>
                      likeReply(comment._id, reply._id)
                    }
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600 mt-1"
                  >
                    <ThumbsUp size={12} />
                    {reply.likes}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      ))}
    </div>
  );
};

export default Comments;
