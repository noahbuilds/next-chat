import { supabase } from "./superbaseClient";

// Fetch messages
export const fetchMessages = async () => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

// Send a message
export const sendMessage = async ({
  content,
  replyTo,
}: {
  content: string;
  replyTo?: string;
}) => {
  const { data, error } = await supabase.from("messages").insert([
    {
      content: content,
      parent_id: replyTo || null, // Set parent_id to replyTo (null if it's not a reply)
    },
  ]);

  if (error) throw error;
  return data;
};

// Edit a message and store the previous versions
export const editMessage = async (messageId: string, newContent: string) => {
  // Fetch the current version of the message before editing
  const { data: originalMessage, error: fetchError } = await supabase
    .from("messages")
    .select("content")
    .eq("id", messageId)
    .single();

  if (fetchError) throw fetchError;

  // Insert the current version of the message into the 'branches' (or 'message_versions') table
  const { error: insertError } = await supabase
    .from("branches") // Insert into 'branches' or 'message_versions'
    .insert([
      {
        message_id: messageId, // Store the message id
        content: originalMessage.content, // Store the previous content
        version_number: new Date().getTime(), // create a version number with timestamps
        created_at: new Date(), // Store when the version was created
      },
    ]);

  if (insertError) throw insertError;

  // Now update the original message to mark it as edited and change the content
  const { data: updatedMessage, error: updateError } = await supabase
    .from("messages")
    .update({
      content: newContent, // Set the new content
      is_edited: true, // Mark the message as edited
    })
    .eq("id", messageId);

  if (updateError) throw updateError;

  return updatedMessage;
};

// Fetch message versions (branches)
export const fetchMessageVersions = async (messageId: string) => {
  const { data, error } = await supabase
    .from("branches") // Assuming this table stores the versions/branches
    .select("*")
    .eq("message_id", messageId);

  if (error) throw error;
  return data;
};

// Fetch message branches
export const fetchBranches = async (messageId: string) => {
  const { data, error } = await supabase
    .from("messages") // Assuming 'messages' table is storing the replies
    .select("*")
    .eq("parent_id", messageId); // Fetch where parent_id matches the messageId

  if (error) throw error;
  return data; // Return the replies
};
