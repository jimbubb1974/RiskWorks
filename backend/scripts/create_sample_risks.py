#!/usr/bin/env python3
"""
Script to create sample risks with fake data for testing reports
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_engine, get_session_local
from app.models.risk import Risk
from app.models.user import User
from app.core.config import settings
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine

# Sample risk data
SAMPLE_RISKS = [
    {
        "risk_name": "Data Breach - Customer Information",
        "risk_description": "Potential unauthorized access to customer personal and financial data stored in our systems.",
        "probability": 3,
        "impact": 4,
        "category": "security",
        "risk_owner": "Sarah Johnson",
        "status": "open",
        "probability_basis": "Recent security assessments and vulnerability scans revealed potential exposure in our customer database systems. Industry threat landscape and attack frequency data suggest possible occurrence.",
        "impact_basis": "Data breach impact assessment and security incident cost analysis indicates significant reputational damage and customer trust impact. Regulatory compliance impact and legal liability assessment shows moderate to high severity.",
        "notes": "This risk requires ongoing monitoring and regular review of mitigation controls. Consider implementing additional safeguards if conditions change. Security team has been assigned and mitigation plan is in development."
    },
    {
        "risk_name": "Supply Chain Disruption",
        "risk_description": "Risk of disruption to critical suppliers affecting production and delivery schedules.",
        "probability": 4,
        "impact": 3,
        "category": "operational",
        "risk_owner": "Michael Chen",
        "status": "open",
        "probability_basis": "Analysis of current process controls indicates moderate vulnerability due to dependency on single-source suppliers. Recent geopolitical events and supply chain monitoring data suggest increased likelihood.",
        "impact_basis": "Impact assessment based on business continuity analysis and operational dependency mapping. Financial modeling indicates moderate operational disruption with potential revenue impact of 15-25%.",
        "notes": "Stakeholder communication plan has been developed to address potential impacts. Regular updates will be provided to management. Cross-functional team has been assembled to address this risk."
    },
    {
        "risk_name": "Regulatory Compliance Violation",
        "risk_description": "Risk of non-compliance with new data protection regulations and industry standards.",
        "probability": 2,
        "impact": 4,
        "category": "compliance",
        "risk_owner": "Jennifer Martinez",
        "status": "open",
        "probability_basis": "Regulatory landscape analysis indicates moderate probability of compliance issues. Recent audit findings and control testing results suggest some vulnerability in current processes.",
        "impact_basis": "Regulatory fine potential and compliance cost analysis indicate moderate impact. Reputational damage assessment and stakeholder confidence impact evaluation shows significant severity.",
        "notes": "Risk owner has been assigned and mitigation plan is in development. Next review scheduled for next quarter. External expert consultation has been obtained for compliance guidance."
    },
    {
        "risk_name": "Technology System Failure",
        "risk_description": "Risk of critical system downtime affecting business operations and customer service.",
        "probability": 3,
        "impact": 3,
        "category": "technical",
        "risk_owner": "David Kim",
        "status": "open",
        "probability_basis": "System architecture review and code quality assessments indicate moderate technical risk. Infrastructure monitoring data shows intermittent issues that could escalate with increased load.",
        "impact_basis": "System availability impact and technical debt analysis suggest moderate severity. Infrastructure cost analysis and technology replacement impact assessment indicates moderate financial exposure.",
        "notes": "Current controls appear adequate but should be tested regularly. Consider stress testing scenarios. Technology roadmap impact and innovation capability assessment completed."
    },
    {
        "risk_name": "Market Competition Risk",
        "risk_description": "Risk of losing market share to new competitors with disruptive business models.",
        "probability": 4,
        "impact": 3,
        "category": "strategic",
        "risk_owner": "Lisa Thompson",
        "status": "open",
        "probability_basis": "Market analysis and competitive intelligence suggest moderate strategic risk. Business environment assessment and stakeholder feedback indicate possible occurrence based on industry trends.",
        "impact_basis": "Strategic objective impact and business goal achievement assessment shows moderate severity. Market position impact and competitive advantage evaluation indicates potential revenue impact.",
        "notes": "Risk has been escalated to senior management for additional resource allocation and strategic guidance. Strategic planning assumptions and scenario analysis completed."
    },
    {
        "risk_name": "Financial Market Volatility",
        "risk_description": "Risk of adverse financial market conditions affecting investment returns and funding costs.",
        "probability": 3,
        "impact": 3,
        "category": "financial",
        "risk_owner": "Robert Wilson",
        "status": "open",
        "probability_basis": "Market volatility analysis and economic indicators suggest moderate probability of occurrence. Historical financial data shows similar events have occurred in 15-20% of comparable periods.",
        "impact_basis": "Financial impact modeling and budget variance analysis indicate moderate monetary exposure. Revenue impact assessment and cost-benefit analysis suggest moderate financial severity.",
        "notes": "Risk tolerance level has been established. Monitoring will continue with monthly status updates. Investment portfolio analysis and financial risk exposure assessment completed."
    }
]

def create_sample_risks():
    """Create sample risks with fake data"""
    
    # Force PostgreSQL connection - use the same URL as the backend
    print(f"Connecting to database: {settings.effective_database_url}")
    
    # Create engine directly with PostgreSQL URL
    db_url = settings.effective_database_url
    if db_url.startswith("postgresql://") and "+" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
    
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Get the first user (assuming there's at least one user)
        user = db.query(User).first()
        
        if not user:
            print("No users found in the database. Please create a user first.")
            return
        
        print(f"Creating sample risks for user: {user.email}")
        
        created_count = 0
        
        for risk_data in SAMPLE_RISKS:
            # Check if risk already exists
            existing_risk = db.query(Risk).filter(
                Risk.risk_name == risk_data["risk_name"],
                Risk.owner_id == user.id
            ).first()
            
            if existing_risk:
                print(f"Risk '{risk_data['risk_name']}' already exists, skipping...")
                continue
            
            # Create new risk
            risk = Risk(
                owner_id=user.id,
                **risk_data
            )
            
            db.add(risk)
            created_count += 1
        
        # Commit all changes
        db.commit()
        
        print(f"Successfully created {created_count} sample risks with fake data:")
        print("- Data Breach - Customer Information")
        print("- Supply Chain Disruption") 
        print("- Regulatory Compliance Violation")
        print("- Technology System Failure")
        print("- Market Competition Risk")
        print("- Financial Market Volatility")
        
    except Exception as e:
        print(f"Error creating sample risks: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating sample risks with fake data...")
    create_sample_risks()
    print("Done!")