# Wil-AI: Command Reference Guide

This document provides a detailed overview of all available commands within the Wil-AI system.

---

## AI & Vision
High-level analytical tools powered by the Groq Vision & Text engines.

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!ai` | `!ai <prompt>` | Interactive technical assistant using Llama-3. |
| `!ocr` | *Reply to image* | Extracts and decodes text from images using AI Vision. |
| `!hd` | *Reply to image* | Enhances and upscales blurry images into high resolution. |
| `!summarize`| `!summarize` | Generates a concise summary of recent group chat history. |

## Media Downloader
Modular engines with multi-stage fallback logic for high success rates.

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!play` | `!play <query>` | Downloads and sends audio from YouTube search. |
| `!tiktok` | `!tiktok <url>` | Downloads TikTok videos without watermark. |
| `!ig` | `!ig <url>` | Downloads Instagram Reels, Posts, and Videos. |
| `!yt` | `!yt <url>` | Downloads YouTube videos (Limited to 720p/50MB). |
| `!twitter`| `!twitter <url>`| Downloads videos from Twitter/X. |

## Utilities
General-purpose tools for productivity and system status.

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!ssweb` | `!ssweb <url>` | Generates a high-quality screenshot of a website. |
| `!sticker`| *Reply to media* | Converts images or short videos into WebP stickers. |
| `!afk` | `!afk [reason]` | Sets your status to AFK. Automatically replies to mentions. |
| `!remindme`| `!remindme 10m text`| Sets a reminder for a specific duration. |
| `!ping` | `!ping` | Returns the system's current response latency. |

## Group Management
Standard administrative tools for group oversight.

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!kick` | *Reply/Mention* | Removes a user from the group. |
| `!promote`| *Reply/Mention* | Promotes a user to group administrator. |
| `!demote` | *Reply/Mention* | Demotes a group administrator back to member. |
| `!hidetag`| `!hidetag [text]` | Sends a message that subtly mentions all members. |

## System
Restricted commands for process management and performance metrics.

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!restart`| `!restart` | Performs a hard restart of the bot process. |
| `!update` | `!update` | Pulls the latest changes from the Git repository. |
| `!speedtest`| `!speedtest` | Executes a network performance benchmark on the VPS. |
| `!sysinfo`| `!sysinfo` | Displays server hardware and OS specifications. |

---
*Note: Some commands require specific API keys (Groq, Apify) configured in `config.js`.*
