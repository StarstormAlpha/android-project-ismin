import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { readFile, writeFile } from 'fs/promises';
import { Monument } from './Monument';
import { ExternalMonuments } from './ExternalMonuments';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class AppService {
  private readonly monumentStorage = new Map<string, Monument>();
  //private readonly logger = new Logger(AppService.name);

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit(): Promise<void> {
    //Call external API
    //link = https://data.opendatasoft.com/api/records/1.0/search/?dataset=monuments-historiques-classes-ou-inscrits-de-type-industriel-en-ile-de-france-do%40datailedefrance&q=
    const externalMonuments = await firstValueFrom(
      this.httpService
        .get<ExternalMonuments>('https://data.opendatasoft.com/api/records/1.0/search/?dataset=monuments-historiques-classes-ou-inscrits-de-type-industriel-en-ile-de-france-do%40datailedefrance&q=')
        .pipe(
          map((response) =>
            response.data.records.map((extMonument) => ({
              datasetid : extMonument.datasetid,
              recordid : extMonument.recordid,
              //fields
              fields: {
                insee : extMonument.fields.insee,
                objectid_1 : extMonument.fields.objectid_1,
                lien_merim : extMonument.fields.lien_merim,
                objectid : extMonument.fields.objectid,
                dep : extMonument.fields.dep,
                type_archi : extMonument.fields.type_archi,
                nomcom : extMonument.fields.nomcom,
                geo_point_2d : extMonument.fields.geo_point_2d,
                st_lengthshape : extMonument.fields.st_lengthshape,
                protection : extMonument.fields.protection,
                immeuble : extMonument.fields.immeuble,
                date_prot : new Date(extMonument.fields.date_prot),
                st_areashape : extMonument.fields.st_areashape,
                ref_merim : extMonument.fields.ref_merim,
                type_prot : extMonument.fields.type_prot,
              },
              //geometry
              geometry : {
                type : extMonument.geometry.type,
                coordinates : extMonument.geometry.coordinates,
              },
              record_timestamp : new Date(extMonument.record_timestamp),
              favorite : false, //champ initialisé par défaut à "faux", on le modifie ensuite quand on fait un getMonuments
            })),
          ),
        ),
    );
    [...externalMonuments].forEach((monument) => this.addMonument(monument));
  }

  async searchFavorites(monumentsArray: Array<Monument> ,imei: string): Promise<void>{
    let fileFavorites = await this.readFavoritesFile();
    for (let monument of monumentsArray){
      for(let favoriteData of fileFavorites){
        if(favoriteData.imeiList.includes(imei)){
          monument.favorite  = true;
        }
      }
    }
  }

  addMonument(monument : Monument): void {
    this.monumentStorage.set(monument.fields.objectid, monument);
  }

  async getAllMonuments(imei: string): Promise<Monument[]> {
    let monumentsArray = Array.from(this.monumentStorage.values()).sort((monument1, monument2) => monument1.fields.immeuble.localeCompare(monument2.fields.immeuble));
    if(imei != undefined) await this.searchFavorites(monumentsArray, imei); //modifie les paramètres "favoris" des monuments à true si les monuments sont en favoris
    return monumentsArray;
  }

  async getMonument(objectid : string, imei: string): Promise<Monument> {
    let fileFavorites = await this.readFavoritesFile();
    const foundMonument = this.monumentStorage.get(objectid);
    if(!foundMonument) throw new Error(`No monument found with identifier : ${objectid}`);
    for(let favoriteData of fileFavorites){
      if(favoriteData.imeiList.includes(imei)){
        foundMonument.favorite  = true;
      }
    }
    return foundMonument;
  }

  async favMonument(objectid : string, imei: string): Promise<void> {
    let fileFavorites = await this.readFavoritesFile();
    this.modifyFavorite(fileFavorites, objectid, imei); //modifier la liste des favoris
    this.writeFavoritesFile(fileFavorites);
    console.log({imei, objectid});
  }

  modifyFavorite(fileFavorites: Array<{objectid: string, imeiList: Array<string>}>, objectid: string, imei: string){
    for(let favoriteData of fileFavorites){
      if(favoriteData.objectid === objectid){
        //monument trouvé dans la liste des favoris
        if(favoriteData.imeiList.includes(imei)){
          //la donnée est déjà en favori
          favoriteData.imeiList.filter(i => i !== imei);
        } else {
          //la donnée d'est pas en favori
          favoriteData.imeiList.push(imei);
        }
        return;
      }
    }
    //le monument n'est pas dans la liste, on l'ajoute donc
    let newFavoriteData = {
      objectid : objectid,
      imeiList : [imei],
    }
    fileFavorites.push(newFavoriteData);
  }

  async readFavoritesFile(){
    let favorites = await readFile('data/favoris.json', 'utf8');
    //convert into array
    const fileFavorites = (JSON.parse(favorites) as any[]).map((favoriteFromFile) => {
      const convertedFavorite : {objectid: string, imeiList: Array<string>} = {
        objectid : favoriteFromFile.objectid,
        imeiList : favoriteFromFile.imeiList,
      };
      return convertedFavorite;
    });
    return fileFavorites; //array of objects containing an objectid + an array of imei
  }

  async writeFavoritesFile(fileFavorites: Array<{objectid: string, imeiList: Array<string>}>){
    await writeFile("data/favoris.json", JSON.stringify(fileFavorites, null, 4));
  }

}
