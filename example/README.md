# Group Chat Demo - React Native Expo

A real-time group chat application built with React Native, Expo Router, and Supabase.

## Features

- Anonymous authentication with Supabase
- Create and join chat rooms
- Real-time messaging using Supabase Realtime
- Clean and modern UI

## Prerequisites

- Node.js installed
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project with the following tables:

### Database Schema

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room participants table
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, profile_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Room participants are viewable by everyone" ON room_participants FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON room_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Messages are viewable by room participants" ON messages FOR SELECT USING (true);
CREATE POLICY "Room participants can send messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your phone

## Project Structure

```
example/
├── app/
│   ├── _layout.tsx        # Root layout with auth routing
│   ├── sign-in.tsx        # Anonymous login screen
│   ├── rooms.tsx          # Rooms list screen
│   └── chat/
│       └── [id].tsx       # Chat screen with real-time messages
├── lib/
│   ├── supabase.ts        # Supabase client configuration
│   └── types.ts           # TypeScript type definitions
└── .env.example           # Environment variables template
```

## How It Works

1. **Authentication**: Users sign in anonymously with Supabase and provide a display name
2. **Rooms**: Users can create new chat rooms or join existing ones
3. **Real-time Chat**: Messages are synchronized in real-time using Supabase Realtime subscriptions
4. **Navigation**: Expo Router handles navigation with protected routes for authenticated users

## Technologies Used

- **React Native** - Cross-platform mobile development
- **Expo** - Development toolchain and runtime
- **Expo Router** - File-based routing
- **Supabase** - Backend as a Service (Auth, Database, Realtime)
- **TypeScript** - Type safety
- **@expo/vector-icons** - Icon library
