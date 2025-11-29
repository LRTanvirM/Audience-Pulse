# How to Enable Automatic Session Deletion (TTL)

I have updated the code to tag every new session with an expiration time (`expireAt`).
Now, you need to tell Google Cloud to actually delete them when that time comes.

## Steps (Takes 1 minute)

1.  **Go to the Google Cloud Console**:
    [https://console.cloud.google.com/firestore/ttl](https://console.cloud.google.com/firestore/ttl)

2.  **Select your Project**:
    Make sure your Firebase project is selected in the top dropdown.

3.  **Create Policy**:
    Click the **"Create Policy"** button.

4.  **Configure**:
    *   **Collection group**: `sessions`
    *   **Timestamp field**: `expireAt`

5.  **Save**:
    Click **Create**.

## That's it!
Google will now automatically delete any session document where the `expireAt` time has passed. This happens in the background and is free of charge.
