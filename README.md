# Songuess

Songuess is a song guessing game, obviously.

It's a chat like interface where songs are playing, and players are competing
to be the first ones to type the title correctly.

Multiple chat rooms can exist on a server, each hosting a different game.

## Creating games

The source of the music for a specific chat room comes from one person called
the host.

The host has a music streaming service opened on their machine, and uses the
[Songuess Chrome extension](https://github.com/tgrbin/songuess_chrome_extension) to stream the music to other players.

## Privacy

Your Google account is used to login to the chat rooms.

This is used to display your name nicely, and to allow you to continue playing
if you join from another session or refresh the current one.

The server has no permanent storage, it keeps the current game rooms and scores
in memory.
