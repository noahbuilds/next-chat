/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import {
  fetchMessages,
  sendMessage,
  editMessage,
  fetchBranches, // Fetch replies using parent_id
  fetchMessageVersions, // Fetch previous message versions
} from "../lib/superbaseService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Chat = () => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<null | string>(null);
  const [replyingTo, setReplyingTo] = useState<null | string>(null); // Track which message you're replying to
  const [messageReplies, setMessageReplies] = useState<{
    [key: string]: any[];
  }>({}); // Track replies for each message
  const [messageVersions, setMessageVersions] = useState<{
    [key: string]: any[];
  }>({}); // Track previous versions for each message

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages"], // Pass the query key inside an object
    queryFn: fetchMessages, // Pass the fetch function inside an object
  });

  // Send message mutation
  const sendMessageMutation = useMutation<null, Error, any>({
    mutationFn: (newMessage: { content: string; replyTo?: string }) =>
      sendMessage(newMessage as any),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: ({
      messageId,
      newContent,
    }: {
      messageId: string;
      newContent: string;
    }) => editMessage(messageId, newContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setEditing(null);
    },
  });

  // Handle sending message (either new message or reply)
  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      content: message,
      replyTo: replyingTo, // Attach reply information
    };

    if (editing) {
      editMessageMutation.mutate({ messageId: editing, newContent: message });
    } else {
      sendMessageMutation.mutate(newMessage); // Send message (with replyTo if it's a reply)
    }

    setMessage("");
    setReplyingTo(null); // Clear replyingTo state after sending
  };

  // Handle editing an existing message
  const handleEditMessage = (id: string, content: string) => {
    setEditing(id);
    setMessage(content);
  };

  // Handle viewing replies for a specific message
  const handleViewBranches = async (id: string) => {
    const branches = await fetchBranches(id); // Get replies for the specific message
    setMessageReplies((prev) => ({
      ...prev,
      [id]: branches, // Update the replies for the specific message
    }));
  };

  // Handle fetching and displaying previous versions of a message
  const handleViewPreviousVersions = async (id: string) => {
    const versions = await fetchMessageVersions(id); // Fetch previous versions
    setMessageVersions((prev) => ({
      ...prev,
      [id]: versions, // Update the versions for the specific message
    }));
  };

  // Handle replying to a message
  const handleReplyMessage = (id: string) => {
    setReplyingTo(id); // Set the message ID being replied to
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="chat-container">
      <ul className="message-list">
        {messages?.map((msg: any) => (
          <li key={msg.id} className="message-item">
            <p>{msg.content}</p>
            {msg.is_edited && <span>(edited)</span>}
            <button onClick={() => handleEditMessage(msg.id, msg.content)}>
              Edit
            </button>
            <button onClick={() => handleViewBranches(msg.id)}>
              View Replies
            </button>
            <button onClick={() => handleReplyMessage(msg.id)}>Reply</button>
            <button onClick={() => handleViewPreviousVersions(msg.id)}>
              View Previous Versions
            </button>

            {/* Display replies */}
            {messageReplies[msg.id] && (
              <ul className="replies">
                {messageReplies[msg.id].map((reply: any) => (
                  <li key={reply.id} className="reply-item">
                    <p>{reply.content}</p>
                  </li>
                ))}
              </ul>
            )}

            {/* Display previous versions */}
            {messageVersions[msg.id] && (
              <ul className="message-versions">
                {messageVersions[msg.id].map((version: any) => (
                  <li key={version.id} className="version-item">
                    <p>Previous Version: {version.content}</p>
                    <small>
                      Version created at:{" "}
                      {new Date(version.created_at).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="input-box">
        {/* Show "Replying to" indicator */}
        {replyingTo && (
          <p className="replying-to">
            Replying to:{" "}
            {messages?.find((msg: any) => msg.id === replyingTo)?.content}
            <button onClick={() => setReplyingTo(null)}>Cancel Reply</button>
          </p>
        )}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={editing ? "Edit message..." : "Type a message..."}
        />
        <button onClick={handleSendMessage}>{editing ? "Save" : "Send"}</button>
      </div>
    </div>
  );
};

export default Chat;
