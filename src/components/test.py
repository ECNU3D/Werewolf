import math
import os
import random
import re
import sys

#
# Complete the 'processLogs' function below.
#
# The function is expected to return a STRING_ARRAY.
# The function accepts following parameters:
#  1. STRING_ARRAY logs
#  2. INTEGER maxSpan
#

def processLogs(logs, maxSpan):
    # Dictionary to store sign-in and sign-out times for each user
    user_sessions = {}
    
    # Parse each log entry
    for log in logs:
        parts = log.split()
        user_id = parts[0]
        timestamp = int(parts[1])
        action = parts[2]
        
        if user_id not in user_sessions:
            user_sessions[user_id] = {}
        
        if action == "sign-in":
            user_sessions[user_id]["sign_in"] = timestamp
        elif action == "sign-out":
            user_sessions[user_id]["sign_out"] = timestamp
    
    # Find users who signed out within maxSpan seconds
    valid_users = []
    
    for user_id, session in user_sessions.items():
        if "sign_in" in session and "sign_out" in session:
            sign_in_time = session["sign_in"]
            sign_out_time = session["sign_out"]
            
            # Check if the user signed out within maxSpan seconds
            if sign_out_time - sign_in_time <= maxSpan:
                valid_users.append(user_id)
    
    # Sort by numeric value (convert to int for proper numeric sorting)
    valid_users.sort(key=lambda x: int(x))
    
    return valid_users

if __name__ == '__main__':
    fptr = open(os.environ['OUTPUT_PATH'], 'w')

    logs_count = int(input().strip())

    logs = []

    for _ in range(logs_count):
        logs_item = input()
        logs.append(logs_item)

    maxSpan = int(input().strip())

    result = processLogs(logs, maxSpan)

    fptr.write('\n'.join(result))
    fptr.write('\n')

    fptr.close()
