import yaml
import sys

def load_yaml(filepath):
    """Loads the YAML file."""
    try:
        with open(filepath, 'r') as file:
            return yaml.safe_load(file)
    except Exception as e:
        print(f"Error reading YAML file: {e}")
        sys.exit(1)

def filter_items(items_list):
    """
    Helper to filter a list of objects that have a 'selected' key.
    Returns a list of 'text' strings for items that are selected.
    """
    if not items_list:
        return []
    
    filtered = []
    for item in items_list:
        # Check if item is a dictionary and has 'selected' set to True
        if isinstance(item, dict) and item.get('selected', False):
            if 'text' in item:
                filtered.append(item['text'])
    return filtered

def generate_markdown(data):
    """Generates the Markdown string from the filtered data."""
    md = []
    
    # --- Header ---
    id_data = data.get('identity', {})
    md.append(f"# {id_data.get('name', 'Name')}")
    md.append(f"**{id_data.get('title', '')}**\n")
    
    contact_parts = []
    if id_data.get('address'): contact_parts.append(id_data['address'])
    if id_data.get('phone'): contact_parts.append(id_data['phone'])
    if id_data.get('email'): contact_parts.append(f"[{id_data['email']}](mailto:{id_data['email']})")
    if id_data.get('linkedin'): 
        url = id_data.get('linkedin_url', '#')
        contact_parts.append(f"[{id_data['linkedin']}]({url})")
    
    md.append(" | ".join(contact_parts))
    md.append("\n---")

    # --- Professional Summary ---
    summary = data.get('summary', {})
    if summary.get('selected', False):
        md.append("## Professional Summary")
        md.append(summary.get('content', '').strip())
        md.append("")

    # --- Work Experience ---
    work = data.get('work_experience', {})
    if work.get('selected', False):
        md.append("## Work Experience")
        for job in work.get('jobs', []):
            if job.get('selected', False):
                # Job Header
                company = job.get('company', '')
                role = job.get('role', '')
                loc = job.get('location', '')
                dates = job.get('date_range', '')
                
                md.append(f"### {company} | {role}")
                md.append(f"_{dates}_ | {loc}\n")
                
                # Filter Responsibilities
                resps = filter_items(job.get('responsibilities', []))
                for r in resps:
                    md.append(f"- {r}")
                md.append("")

    # --- Education ---
    edu = data.get('education', {})
    if edu.get('selected', False):
        md.append("## Education")
        for deg in edu.get('degrees', []):
            if deg.get('selected', False):
                md.append(f"**{deg.get('degree')}**")
                md.append(f"{deg.get('institution')} | {deg.get('year')}")
                md.append("")

    # --- Skills ---
    skills = data.get('skills', {})
    if skills.get('selected', False):
        md.append("## Skills")
        categories = skills.get('categories', {})
        
        for key, cat in categories.items():
            if cat.get('selected', False):
                label = cat.get('label', key.replace('_', ' ').title())
                # Get filtered items
                items = filter_items(cat.get('items', []))
                
                if items:
                    md.append(f"**{label}:**")
                    for item in items:
                        md.append(f"- {item}")
                    md.append("")

    # --- Professional Interests ---
    interests = data.get('professional_interests', {})
    if interests.get('selected', False):
        md.append("## Professional Interests")
        items = filter_items(interests.get('items', []))
        for item in items:
            md.append(f"- {item}")
        md.append("")

    # --- Additional Information ---
    additional = data.get('additional_information', {})
    if additional.get('selected', False):
        md.append("## Additional Information")
        items = filter_items(additional.get('items', []))
        for item in items:
            md.append(f"- {item}")
        md.append("")

    return "\n".join(md)

def main():
    input_file = 'master_cv.yaml'
    output_file = 'kok_shew_juan_cv.md'
    
    print(f"Reading {input_file}...")
    data = load_yaml(input_file)
    
    print("Filtering and Generating Markdown...")
    markdown_content = generate_markdown(data)
    
    with open(output_file, 'w') as f:
        f.write(markdown_content)
    
    print(f"Successfully generated: {output_file}")

if __name__ == "__main__":
    main()