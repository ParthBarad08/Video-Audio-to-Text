def extract_action_points(transcript):
    action_keywords = ['will', 'need to', 'should', 'must', 'schedule', 'assign', 'send', 'submit']
    sentences = transcript.split('.')
    actions = [s.strip() for s in sentences if any(k in s.lower() for k in action_keywords)]
    return actions
