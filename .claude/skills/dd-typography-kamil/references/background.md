# Background

Moved out of SKILL.md to keep it short; nothing here is needed for a normal run.

## Decisions worth knowing

- **Every weight is a file.** Two weights is the sweet spot; a full variable range is convenient but heaviest. Italic is not loaded unless asked.
- **System font costs nothing** and looks native, but differs per device (SF Pro on iPhone, Roboto on Android), so screenshots differ by platform.
- **16 px is the floor for fields** whatever the default size, or iPhone zooms in when a field is tapped.
- **Tokens, not numbers.** Dev mode matches values to tokens by value, so a raw `15px` shows no chip; a token does.
- **Scale from the base.** Changing the default size later is one number when every size is a token.
