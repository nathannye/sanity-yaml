import { defineField } from "sanity";
import { createPreview } from "../../utils/preview";

export default {
    name: 'BlogPost',
    title: 'Blog Post',
    type: 'object',
    fields: [
                 
                
                
                 
                
                
                 
                
                
                 
                
                
                 
                
                
                 defineField({
            name: 'author',
            type: 'reference',
            to: [],
        }),  
                
                
                 
                
                
                 
                
                
                 
                
                
                 
                
                
                 
                
                
                 
                 defineField({
            name: 'seo',
            type: 'object',
            fields: [
                         
                        
                        
                         
                        
                        
                         
                        
                        
            ]
        }),
         
                
    ],
    preview: createPreview('Blog Post'),
}