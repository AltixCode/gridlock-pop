# Upload certificate

`upload-certificate.pem` is the **public** certificate of the Android upload key
that EAS generated and holds for this project. It is a public certificate, not a
key — safe to commit.

## Why it is here

The Play Console record for Gridlock Pop already has a **different** upload key
registered, and the original keystore is not on this machine:

| | SHA-1 |
| --- | --- |
| Play expects | `7E:83:2A:33:82:FC:66:50:F2:57:DA:06:05:55:17:32:DA:56:B8:E4` |
| EAS signs with | `4F:A8:33:38:63:A3:4A:33:91:11:82:79:7A:11:68:EE:AE:40:DC:11` |

So every upload is rejected with *"Your Android App Bundle is signed with the
wrong key."*

## Fix (one of two)

**A — register EAS's key (preferred if the original keystore is lost).**
Play Console → the app → Test and release → App integrity → App signing →
**Request upload key reset**, and attach this `upload-certificate.pem`. Google
usually processes it within a couple of days; uploads work immediately after.

**B — give EAS the original keystore.** If the `.jks`/`.keystore` that matches
Play's fingerprint still exists somewhere, run
`eas credentials --platform android` and upload it. Then no reset is needed.

Check which you have before choosing: `keytool -list -v -keystore <file>` and
compare the SHA-1 to the table above.
