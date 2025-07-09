from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from pymongo import MongoClient
from datetime import datetime
import uuid

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/unsubscribe_app')
client = MongoClient(MONGO_URL)
db = client.unsubscribe_app

# Pydantic models
class Subscription(BaseModel):
    id: str
    email: str
    service_name: str
    sender_email: str
    unsubscribe_link: Optional[str] = None
    unsubscribe_email: Optional[str] = None
    status: str = "detected"  # detected, unsubscribe_sent, unsubscribed
    detected_at: datetime
    unsubscribe_sent_at: Optional[datetime] = None

class UnsubscribeRequest(BaseModel):
    subscription_id: str
    email_content: str

@app.get("/")
async def root():
    return {"message": "Unsubscribe App API"}

@app.get("/api/subscriptions", response_model=List[Subscription])
async def get_subscriptions():
    """Get all detected subscriptions"""
    try:
        subscriptions = list(db.subscriptions.find({}, {"_id": 0}))
        return subscriptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan-email")
async def scan_email():
    """Scan Gmail for subscriptions"""
    try:
        # This will be implemented with Gmail API integration
        return {"message": "Email scan initiated", "status": "pending"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-unsubscribe-email/{subscription_id}")
async def generate_unsubscribe_email(subscription_id: str):
    """Generate unsubscribe email for a subscription"""
    try:
        subscription = db.subscriptions.find_one({"id": subscription_id}, {"_id": 0})
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        # Generate unsubscribe email template
        email_template = f"""
To: {subscription['sender_email']}
Subject: Unsubscribe Request

Dear {subscription['service_name']},

I would like to unsubscribe from all email communications.

Please remove my email address ({subscription['email']}) from your mailing list.

Thank you for your understanding.

Best regards
"""
        
        return {
            "email_content": email_template,
            "to": subscription['sender_email'],
            "subject": "Unsubscribe Request"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send-unsubscribe")
async def send_unsubscribe(request: UnsubscribeRequest):
    """Send unsubscribe email"""
    try:
        # Update subscription status
        db.subscriptions.update_one(
            {"id": request.subscription_id},
            {
                "$set": {
                    "status": "unsubscribe_sent",
                    "unsubscribe_sent_at": datetime.now()
                }
            }
        )
        
        # This will be implemented with Gmail API integration
        return {"message": "Unsubscribe email sent", "status": "sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/subscriptions/{subscription_id}/status")
async def update_subscription_status(subscription_id: str, status: str):
    """Update subscription status"""
    try:
        result = db.subscriptions.update_one(
            {"id": subscription_id},
            {"$set": {"status": status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        return {"message": "Status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)