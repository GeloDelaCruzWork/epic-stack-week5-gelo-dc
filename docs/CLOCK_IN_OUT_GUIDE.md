# Clock In / Clock Out Feature Guide

This document provides a detailed explanation of the clock-in and clock-out functionality implemented in the file `app/routes/clock.in.out.tsx`.

## Overview

This feature allows authenticated users to record their work hours. The system provides a simple interface to "Clock In" when they start working and "Clock Out" when they finish. The UI dynamically changes based on the user's current clock-in status.

## File Location

-   `app/routes/clock.in.out.tsx`

## How It Works

The functionality is built using a Remix route, which includes server-side logic for data loading and form submissions, as well as the client-side user interface.

### 1. Data Loading (`loader` function)

When a user navigates to the clock-in/out page, the `loader` function runs on the server to determine the user's current status.

-   **Authentication**: It first ensures the user is logged in by calling `requireUserId`.
-   **Status Check**: It queries the database for the most recent `timeLog` entry for that user where the `endTime` is `null`.
    -   If a record is found, it means the user is **currently clocked in**.
    -   If no record is found, the user is **currently clocked out**.
-   **Data Transfer**: The function returns this `timeLog` record (or `null`) to the front-end component.

### 2. User Actions (`action` function)

All form submissions from this page are handled by the `action` function on the server. A hidden form input named `intent` is used to determine whether the user is clocking in or out.

-   **Authentication**: It also requires the user to be logged in.
-   **Clock In (`intent: 'clock-in'`)**:
    -   When the "Clock In" button is pressed, the server receives the `clock-in` intent.
    -   It creates a **new record** in the `timeLog` table with the user's ID and the current timestamp as the `startTime`. The `endTime` is left empty (`null`).
-   **Clock Out (`intent: 'clock-out'`)**:
    -   When the "Clock Out" button is pressed, the server receives the `clock-out` intent.
    -   It finds the user's current "open" `timeLog` record (where `endTime` is `null`).
    -   It **updates** that existing record by setting the `endTime` to the current timestamp.

### 3. User Interface (`ClockInOutRoute` component)

The React component uses the data from the `loader` to present the correct UI to the user.

-   **If Clocked In (`latestTimeLog` exists)**:
    -   A message "You are currently clocked in" is displayed, along with the `startTime`.
    -   A form with a **"Clock Out"** button is rendered. This form includes the hidden input `<input type="hidden" name="intent" value="clock-out" />`.
-   **If Clocked Out (`latestTimeLog` is null)**:
    -   A message "You are currently clocked out" is displayed.
    -   A form with a **"Clock In"** button is rendered. This form includes the hidden input `<input type="hidden" name="intent" value="clock-in" />`.


