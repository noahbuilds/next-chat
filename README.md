
---

# Chat Application

This chat application supports threaded conversations, message editing, and version tracking of edited messages. It is built with Nextjs, Supabase, and React Query for managing data fetching and mutations.

## Table of Contents

- [Features](#features)
- [Database Setup](#database-setup)
  - [Messages Table](#messages-table)
  - [Branches Table](#branches-table)
- [Message Editing and Versioning](#message-editing-and-versioning)
- [How to Use](#how-to-use)
  - [Reply to a Message](#reply-to-a-message)
  - [Edit a Message](#edit-a-message)
  - [View Previous Versions](#view-previous-versions)
- [Running the Application](#running-the-application)

## Features

- **Send messages**: Post new messages to the chat.
- **Reply to messages**: Respond to an existing message.
- **Edit messages**: Update existing messages and track previous versions.
- **View message history**: Access previous versions of edited messages.

## Database Setup

To support message sending, replying, and editing with version control, you'll need to create two tables: `messages` and `branches`.

### Messages Table

This table stores the original messages, as well as references for replies and edited messages.

```sql
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  parent_id uuid NULL,
  is_edited boolean DEFAULT false,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE CASCADE
) TABLESPACE pg_default;
```

- **Columns**:
  - `id`: Unique identifier for each message (UUID).
  - `content`: The text content of the message.
  - `created_at`: Timestamp for when the message was created.
  - `parent_id`: Used to reference the parent message in a reply.
  - `is_edited`: Boolean indicating whether the message has been edited.

### Branches Table

This table stores the versions of edited messages. Each time a message is edited, a new version is stored here, preserving the message history.

```sql
CREATE TABLE public.branches (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  message_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  content text NOT NULL,
  version_number numeric NOT NULL,
  CONSTRAINT branches_pkey PRIMARY KEY (id),
  CONSTRAINT branches_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) TABLESPACE pg_default;
```

- **Columns**:
  - `id`: Unique identifier for each branch (UUID).
  - `message_id`: References the `id` of the original message from the `messages` table.
  - `created_at`: Timestamp for when the version was created.
  - `content`: The text content of the version.
  - `version_number`: Numeric value to track the version number of the edited message.

## Message Editing and Versioning

- **Message Creation**: New messages are stored in the `messages` table.
- **Replying**: Replies to messages are tracked using the `parent_id` field in the `messages` table, allowing for threaded conversations.
- **Editing**: When a message is edited, the `is_edited` field is set to `true`, and the original content is stored in the `branches` table as a new version. This maintains a history of the message edits, accessible via the version number.
- **Version History**: The `branches` table stores all previous versions of a message, including the content and timestamp for each version.

## How to Use

### Reply to a Message

To reply to a message, click the "Reply" button next to the message. The message you're replying to will be highlighted, and your reply will be linked to it.

### Edit a Message

To edit a message, click the "Edit" button. This will allow you to modify the content of the message. Once you save your changes, the message will be marked as edited, and the previous version will be stored in the `branches` table.

### View Previous Versions

To view previous versions of an edited message, click the "View Replies" button. This will display all the past versions of the message from the `branches` table, along with the version number and content.

## Running the Application

1. Clone the repository:

```bash
git clone https://github.com/yourusername/chat-app.git
```

2. Install dependencies:

```bash
npm install
```

3. Set up Supabase:
   - Create a new project on [Supabase](https://supabase.com/).
   - Create the tables using the SQL provided in the [Database Setup](#database-setup) section.
   - Configure your environment variables to connect to Supabase by creating a `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the application:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000` to view the chat application.

---