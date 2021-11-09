export interface Monument {
    datasetid : string,
    recordid : string,
    //fields
    insee : string,
    objectid_1 : string,
    lien_merim : string,
    objectid : string,
    dep : string,
    type_archi : string,
    nomcom : string,
    geo_point_2d : number[],
    st_lengthshape : string,
    protection : string,
    immeuble : string,
    date_prot : Date,
    st_areashape : string,
    ref_merim : string,
    type_prot : string,
    //geometry
    type : string,
    coordinates : number[],
    record_timestamp : Date,
    favorite : boolean,
}